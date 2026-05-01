import mongoose from 'mongoose';
import Showtime from './showtime.model.js';
import Screen from '../screens/screen.model.js';
import Movie from '../movies/movie.model.js';
import Theatre from '../theatres/theatre.model.js';
import Seat from '../seats/seat.model.js';
import ApiError from '../../utils/ApiError.js';
import { setCache, getCache, deleteCache } from '../../config/redis.js';
import { REDIS_KEYS, SHOW_STATUS } from '../../utils/constants.js';

/**
 * Create a showtime AND bulk-generate Seat documents from the screen layout
 */
export const createShowtime = async (data) => {
  const [movie, screen] = await Promise.all([
    Movie.findById(data.movie),
    Screen.findById(data.screen).populate('theatre'),
  ]);

  if (!movie)  throw ApiError.notFound('Movie not found');
  if (!screen) throw ApiError.notFound('Screen not found');

  // Verify screen belongs to the theatre in data
  if (screen.theatre._id.toString() !== data.theatre) {
    throw ApiError.badRequest('Screen does not belong to this theatre');
  }

  // Check for overlapping show on same screen
  const startTime = new Date(data.startTime);
  const endTime   = new Date(startTime.getTime() + movie.duration * 60 * 1000);

  const overlap = await Showtime.findOne({
    screen: data.screen,
    status: SHOW_STATUS.SCHEDULED,
    $or: [
      { startTime: { $lt: endTime,   $gte: startTime } },
      { endTime:   { $gt: startTime, $lte: endTime   } },
    ],
  });
  if (overlap) throw ApiError.conflict('Another show is already scheduled during this time');

  // Effective pricing: showtime override || screen default
  const pricing = {
    recliner: data.pricing?.recliner ?? screen.pricing.recliner,
    premium:  data.pricing?.premium  ?? screen.pricing.premium,
    gold:     data.pricing?.gold     ?? screen.pricing.gold,
    silver:   data.pricing?.silver   ?? screen.pricing.silver,
  };

  const date = startTime.toISOString().slice(0, 10);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const [showtime] = await Showtime.create(
      [{
        ...data,
        endTime,
        date,
        pricing,
        totalSeats:     screen.totalSeats,
        availableSeats: screen.totalSeats,
      }],
      { session }
    );

    // Bulk-create Seat documents from the screen's seat layout
    const seatDocs = screen.seatLayout
      .filter((s) => !s.isBlocked)
      .map((s) => ({
        showtime: showtime._id,
        screen:   screen._id,
        theatre:  screen.theatre._id,
        row:      s.row,
        number:   s.number,
        label:    s.label,
        type:     s.type,
        price:    pricing[s.type] || pricing.silver,
      }));

    await Seat.insertMany(seatDocs, { session });

    await session.commitTransaction();
    return showtime;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

/**
 * Get all showtimes for a movie on a specific date, grouped by theatre
 */
export const getShowtimesForMovie = async (movieId, city, date) => {
  const cacheKey = `${REDIS_KEYS.SHOWTIME_SEATS}${movieId}:${city}:${date}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const theatres = await Theatre.find({
    'location.city': new RegExp(city, 'i'),
    isActive: true,
  }).select('_id');

  const showtimes = await Showtime.find({
    movie:   movieId,
    theatre: { $in: theatres.map((t) => t._id) },
    date,
    status:  SHOW_STATUS.SCHEDULED,
  })
    .populate('theatre', 'name location amenities cancellationPolicy')
    .populate('screen',  'name screenType soundSystem')
    .sort({ startTime: 1 })
    .lean();

  // Group by theatre
  const grouped = {};
  for (const show of showtimes) {
    const tid = show.theatre._id.toString();
    if (!grouped[tid]) {
      grouped[tid] = { theatre: show.theatre, shows: [] };
    }
    grouped[tid].shows.push({
      _id:            show._id,
      screen:         show.screen,
      startTime:      show.startTime,
      endTime:        show.endTime,
      language:       show.language,
      format:         show.format,
      availableSeats: show.availableSeats,
      pricing:        show.pricing,
      status:         show.status,
    });
  }

  const result = Object.values(grouped);
  await setCache(cacheKey, result, 60); // Cache for 1 minute
  return result;
};

export const getShowtimeById = async (id) => {
  const show = await Showtime.findById(id)
    .populate('movie',   'title duration certification posterUrl')
    .populate('theatre', 'name location amenities cancellationPolicy')
    .populate('screen',  'name screenType soundSystem pricing');
  if (!show) throw ApiError.notFound('Showtime not found');
  return show;
};

export const cancelShowtime = async (id) => {
  const show = await Showtime.findByIdAndUpdate(
    id,
    { status: SHOW_STATUS.CANCELLED },
    { new: true }
  );
  if (!show) throw ApiError.notFound('Showtime not found');
  // TODO: trigger refunds for all bookings on this show
  return show;
};

/** Called by booking service after seat confirmation */
export const updateSeatCounts = async (showtimeId, delta, session = null) => {
  const opts = session ? { session } : {};
  await Showtime.findByIdAndUpdate(
    showtimeId,
    {
      $inc: {
        availableSeats: -delta,
        bookedSeats:     delta,
      },
    },
    opts
  );
};
