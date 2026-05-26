import Screen from './screen.model.js';
import Theatre from '../theatres/theatre.model.js';
import Showtime from '../showtimes/showtime.model.js';
import ApiError from '../../utils/ApiError.js';
import TheatreOwner from '../auth/theatreOwner.model.js';
import { ONBOARDING_STATUS } from '../../utils/constants.js';

/**
 * createScreen
 *
 * BUG FIXED — root cause of "theatre ID is missing":
 *
 * The route is mounted at POST /theatres/:theatreId/screens with
 * { mergeParams: true } on the screen router.  theatreId therefore lives on
 * req.params, NOT req.body.  The old controller ignored req.params.theatreId
 * entirely and never passed it here.  This function now accepts it as a 4th
 * argument and uses it for BOTH the admin path (previously body-only) and the
 * theatre-owner path (previously ownedTheatre-only).
 *
 * Additional fixes in the theatre-owner path:
 *  1. Guard: owner must have completed onboarding (onboardingStatus === 'completed')
 *     before screens can be created — without this the Theatre document doesn't
 *     exist yet (ownedTheatre is null) and the error is misleading.
 *  2. Ownership verification: if a theatreId is explicitly provided via URL,
 *     verify it actually belongs to the requesting owner — without this any
 *     approved owner could add screens to any theatre.
 */
export const createScreen = async (data, userId, role, theatreId) => {
  let theatre;

  if (role === 'admin') {
    // Admin path — theatreId from URL param takes priority over body
    const id = theatreId || data.theatreId;
    if (!id) throw ApiError.badRequest('Theatre ID is required');
    theatre = await Theatre.findById(id);

  } else {
    // Theatre owner path
    const owner = await TheatreOwner.findById(userId);
    if (!owner) throw ApiError.notFound('Theatre owner not found');

    // GUARD: onboarding must be complete before screens can be created.
    // When onboarding completes, saveOnboarding() creates the Theatre document
    // and writes its _id into owner.ownedTheatre. Before that point ownedTheatre
    // is null and there is no theatre to attach a screen to.
    if (owner.onboardingStatus !== ONBOARDING_STATUS.COMPLETED) {
      throw ApiError.badRequest(
        'Complete your theatre onboarding before creating screens. ' +
        `Current status: ${owner.onboardingStatus}`
      );
    }

    if (!owner.ownedTheatre) {
      throw ApiError.badRequest(
        'No theatre linked to your account. ' +
        'Please contact support — your onboarding may not have completed correctly.'
      );
    }

    // If theatreId was passed via URL, verify it matches the owner's theatre
    if (theatreId && theatreId.toString() !== owner.ownedTheatre.toString()) {
      throw ApiError.forbidden('You can only add screens to your own theatre');
    }

    theatre = await Theatre.findById(owner.ownedTheatre);
  }

  if (!theatre) throw ApiError.notFound('Theatre not found');
  if (!theatre.isActive) throw ApiError.badRequest('Cannot add screens to an inactive theatre');

  const screen = await Screen.create({
    ...data,
    theatre: theatre._id,
  });

  await Theatre.findByIdAndUpdate(theatre._id, { $inc: { totalScreens: 1 } });

  return screen;
};

export const updateScreen = async (screenId, data, userId, role) => {
  const screen = await Screen.findById(screenId).populate('theatre', 'owner');
  if (!screen) throw ApiError.notFound('Screen not found');

  if (role !== 'admin' && screen.theatre.owner?.toString() !== userId) {
    throw ApiError.forbidden('Not authorized');
  }

  Object.assign(screen, data);
  await screen.save();
  return screen;
};

export const getScreenById = async (screenId) => {
  const screen = await Screen.findById(screenId).populate('theatre', 'name location');
  if (!screen) throw ApiError.notFound('Screen not found');
  return screen;
};

export const deleteScreen = async (screenId, userId, role) => {
  const screen = await Screen.findById(screenId).populate('theatre', 'owner');
  if (!screen) throw ApiError.notFound('Screen not found');

  if (role !== 'admin' && screen.theatre.owner?.toString() !== userId) {
    throw ApiError.forbidden('Not authorized');
  }

  const activeShowtimes = await Showtime.findOne({
    screen: screenId,
    status: { $in: ['scheduled'] },
  });

  if (activeShowtimes) {
    throw ApiError.badRequest(
      'Cannot delete screen with active showtimes. Cancel or complete all shows first.'
    );
  }

  screen.isActive = false;
  await screen.save();
  await Theatre.findByIdAndUpdate(screen.theatre._id, { $inc: { totalScreens: -1 } });
  return screen;
};

export const getSeatLayout = async (screenId) => {
  const screen = await Screen.findById(screenId).select('seatLayout pricing name screenType');
  if (!screen) throw ApiError.notFound('Screen not found');

  const rowMap = {};
  for (const seat of screen.seatLayout) {
    if (!rowMap[seat.row]) rowMap[seat.row] = [];
    rowMap[seat.row].push(seat);
  }

  const rows = Object.entries(rowMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([row, seats]) => ({
      row,
      seats: seats.sort((a, b) => a.number - b.number),
    }));

  return {
    screen: { name: screen.name, type: screen.screenType, pricing: screen.pricing },
    rows,
  };
};
