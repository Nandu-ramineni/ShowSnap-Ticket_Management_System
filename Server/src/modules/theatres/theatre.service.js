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

