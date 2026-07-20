import slugify from 'slugify';
import Theatre from './theatre.model.js';
import Screen from '../screens/screen.model.js';
import ApiError from '../../utils/ApiError.js';
import { setCache, getCache, deleteCache } from '../../config/redis.js';
import { REDIS_KEYS } from '../../utils/constants.js';

export const createTheatre = async (data, ownerId) => {
  data.slug = slugify(data.name, { lower: true, strict: true });
  const existing = await Theatre.findOne({ slug: data.slug });
  if (existing) data.slug = `${data.slug}-${Date.now()}`;
  return Theatre.create({ ...data, owner: ownerId });
};

// ─── TheatreOwner ↔ Theatre adapter ────────────────────────────────────────────
// TheatreOwner.theatreInfo/location/amenities/cancellationPolicy are the
// onboarding-shaped profile the owner fills in; Theatre is the canonical
// record everything else (screens, showtimes, search, nearby) joins against.
// The two schemas do not share field names or shapes 1:1 (e.g. location has
// `streetAddress` vs `address`; amenities is a flags object vs an array of
// {name, available}) — this mapper is the single place that bridges them.

const AMENITY_LABELS = {
  parking:          'Parking',
  foodCourt:        'Food Court',
  wheelchairAccess: 'Wheelchair Access',
  mTicket:          'M-Ticket',
  threeD:           '3D',
  dolbySound:       'Dolby Sound',
  fourDX:           '4DX',
  reclinerSeats:    'Recliner Seats',
  atm:              'ATM',
  playing:          'Kids Play Area',
  lounge:           'Lounge',
};

const mapOwnerAmenities = (amenities = {}) =>
  Object.entries(AMENITY_LABELS).map(([key, name]) => ({
    name,
    available: !!amenities[key],
  }));

/** Builds Theatre-shaped data from a TheatreOwner's onboarding profile. */
export const buildTheatreDataFromOwner = (owner) => ({
  name: owner.theatreInfo?.theatreName,
  isMultiplex: !!owner.isMultiplex,
  location: {
    address: owner.location?.streetAddress,
    city:    owner.location?.city,
    state:   owner.location?.state,
    pincode: owner.location?.pincode,
  },
  amenities: mapOwnerAmenities(owner.amenities),
  contactPhone: owner.theatreInfo?.contactPhone,
  contactEmail: owner.theatreInfo?.contactEmail,
  website: owner.theatreInfo?.website,
  cancellationPolicy: {
    allowed:          owner.cancellationPolicy?.allowCancellations ?? true,
    cutoffHours:      owner.cancellationPolicy?.cutoffHours ?? 2,
    refundPercentage: owner.cancellationPolicy?.refundPercentage ?? 100,
  },
});

/**
 * Creates the canonical Theatre document for a theatre owner whose onboarding
 * has just completed. Called from theatreOwner.service.js#saveOnboarding and
 * from the one-time backfill script (scripts/backfill-owned-theatre.js) for
 * owners who completed onboarding before this fix existed.
 */
export const createTheatreForOwner = async (owner) =>
  createTheatre(buildTheatreDataFromOwner(owner), owner._id);

/**
 * Writes an owner's post-onboarding profile edits through to their existing
 * Theatre document. `name`/`slug` are deliberately excluded — theatreName is
 * immutable after registration (enforced in theatreOwner.service.js#updateProfile).
 */
export const syncTheatreFromOwner = async (owner) => {
  const data = buildTheatreDataFromOwner(owner);
  delete data.name;
  await Theatre.findByIdAndUpdate(owner.ownedTheatre, { $set: data });
  await deleteCache(`${REDIS_KEYS.THEATRE_CACHE}${owner.ownedTheatre}`);
};

export const listTheatres = async ({ page, limit, skip, city, multiplex, search }) => {
  const filter = { isActive: true };
  if (city)      filter['location.city'] = new RegExp(city, 'i');
  if (multiplex !== undefined) filter.isMultiplex = multiplex === 'true';
  if (search)    filter.$text = { $search: search };

  const [theatres, total] = await Promise.all([
    Theatre.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
    Theatre.countDocuments(filter),
  ]);
  return { theatres, total };
};

export const getTheatreById = async (id) => {
  const cacheKey = `${REDIS_KEYS.THEATRE_CACHE}${id}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const theatre = await Theatre.findOne({ _id: id, isActive: true })
    .populate('owner', 'name email')
    .lean();
  if (!theatre) throw ApiError.notFound('Theatre not found');

  await setCache(cacheKey, theatre, 300);
  return theatre;
};

export const updateTheatre = async (id, data, userId, role) => {
  const theatre = await Theatre.findById(id);
  if (!theatre) throw ApiError.notFound('Theatre not found');

  // Only admin or owner can update
  if (role !== 'admin' && theatre.owner?.toString() !== userId) {
    throw ApiError.forbidden('Not authorized to update this theatre');
  }

  Object.assign(theatre, data);
  await theatre.save();
  await deleteCache(`${REDIS_KEYS.THEATRE_CACHE}${id}`);
  return theatre;
};

export const getTheatreScreens = async (theatreId) => {
  return Screen.find({ theatre: theatreId, isActive: true }).lean();
};

export const getTheatresByCity = async (city) => {
  return Theatre.find({ 'location.city': new RegExp(city, 'i'), isActive: true })
    .select('name location chainName isMultiplex amenities totalScreens appRating')
    .lean();
};

/** Theatres within radius (km) of coordinates — uses MongoDB 2dsphere index */
export const getNearbyTheatres = async (lat, lng, radiusKm = 10) => {
  return Theatre.find({
    isActive: true,
    'location.coordinates': {
      $near: {
        $geometry:    { type: 'Point', coordinates: [lng, lat] },
        $maxDistance: radiusKm * 1000,
      },
    },
  })
    .select('name location chainName isMultiplex totalScreens appRating')
    .limit(20)
    .lean();
};

export const deleteTheatre = async (id, userId, role) => {
  const theatre = await Theatre.findById(id);
  if (!theatre) throw ApiError.notFound('Theatre not found');

  // Only admin or owner can delete
  if (role !== 'admin' && theatre.owner?.toString() !== userId) {
    throw ApiError.forbidden('Not authorized to delete this theatre');
  }

  theatre.isActive = false;
  await theatre.save();
  await deleteCache(`${REDIS_KEYS.THEATRE_CACHE}${id}`);
  return;
};

