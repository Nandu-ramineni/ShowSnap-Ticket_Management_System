import { randomUUID } from 'crypto';
import Seat from './seat.model.js';
import Showtime from '../showtimes/showtime.model.js';
import { acquireLock, releaseLock, deleteCache } from '../../config/redis.js';
import ApiError from '../../utils/ApiError.js';
import { SEAT_STATUS, REDIS_KEYS } from '../../utils/constants.js';
import env from '../../config/env.js';
import logger from '../../utils/logger.js';

const lockKey = (showtimeId, seatId) =>
  `${REDIS_KEYS.SEAT_LOCK}${showtimeId}:${seatId}`;

/**
 * Get seat map for a showtime (current live status)
 */
export const getSeatMap = async (showtimeId) => {
  const seats = await Seat.find({ showtime: showtimeId })
    .select('row number label type price status')
    .lean();

  const rowMap = {};
  for (const seat of seats) {
    if (!rowMap[seat.row]) rowMap[seat.row] = [];
    rowMap[seat.row].push(seat);
  }

  return Object.entries(rowMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([row, seats]) => ({
      row,
      seats: seats.sort((a, b) => a.number - b.number),
    }));
};

/**
 * Atomically lock seats for a user using Redis + MongoDB.
 * Returns a lockValue the client should pass back at booking time.
 */
export const lockSeats = async (showtimeId, seatIds, userId) => {
  if (!seatIds?.length)   throw ApiError.badRequest('No seats provided');
  if (seatIds.length > 8) throw ApiError.badRequest('Cannot lock more than 8 seats at once');

  // Validate seats exist and are available
  const seats = await Seat.find({
    _id:      { $in: seatIds },
    showtime: showtimeId,
    status:   SEAT_STATUS.AVAILABLE,
  });

  if (seats.length !== seatIds.length) {
    throw ApiError.conflict('One or more selected seats are not available');
  }

  const lockValue   = randomUUID();
  const acquired    = [];
  const lockedUntil = new Date(Date.now() + env.seatLockTtl * 1000);

  try {
    for (const seat of seats) {
      const key = lockKey(showtimeId, seat._id.toString());
      const ok  = await acquireLock(key, lockValue, env.seatLockTtl);
      if (!ok) throw ApiError.conflict(`Seat ${seat.label} was just taken. Please choose another.`);
      acquired.push(key);
    }

    // Persist lock to DB
    await Seat.updateMany(
      { _id: { $in: seatIds } },
      { status: SEAT_STATUS.LOCKED, lockedBy: userId, lockedUntil }
    );

    // Invalidate showtime seat cache
    await deleteCache(`${REDIS_KEYS.SHOWTIME_SEATS}${showtimeId}`);

    return {
      lockValue,
      lockedUntil,
      seats: seats.map((s) => ({ id: s._id, label: s.label, type: s.type, price: s.price })),
      total: seats.reduce((sum, s) => sum + s.price, 0),
    };
  } catch (err) {
    // Roll back all acquired Redis locks
    await Promise.allSettled(acquired.map((k) => releaseLock(k, lockValue)));

    // Roll back DB (only seats we locked)
    await Seat.updateMany(
      { _id: { $in: seatIds }, lockedBy: userId },
      { status: SEAT_STATUS.AVAILABLE, lockedBy: null, lockedUntil: null }
    );

    throw err;
  }
};

/**
 * Release seat locks manually (user goes back / abandons checkout)
 */
export const releaseSeats = async (showtimeId, seatIds, userId) => {
  const seats = await Seat.find({
    _id:      { $in: seatIds },
    showtime: showtimeId,
    lockedBy: userId,
    status:   SEAT_STATUS.LOCKED,
  });

  await Promise.allSettled(
    seats.map((s) =>
      releaseLock(lockKey(showtimeId, s._id.toString()), userId)
    )
  );

  await Seat.updateMany(
    { _id: { $in: seats.map((s) => s._id) } },
    { status: SEAT_STATUS.AVAILABLE, lockedBy: null, lockedUntil: null }
  );

  await deleteCache(`${REDIS_KEYS.SHOWTIME_SEATS}${showtimeId}`);
};

/**
 * Mark seats as permanently booked (called inside booking transaction)
 */
export const confirmSeats = async (seatIds, userId, bookingId, session) => {
  await Seat.updateMany(
    { _id: { $in: seatIds }, lockedBy: userId },
    {
      status:      SEAT_STATUS.BOOKED,
      bookedBy:    userId,
      booking:     bookingId,
      lockedBy:    null,
      lockedUntil: null,
    },
    { session }
  );
};

/**
 * Release booked seats back to available (refund flow)
 */
export const releaseBookedSeats = async (seatIds) => {
  await Seat.updateMany(
    { _id: { $in: seatIds } },
    { status: SEAT_STATUS.AVAILABLE, bookedBy: null, booking: null, lockedBy: null, lockedUntil: null }
  );
};

/**
 * Background job: clear expired locks from DB
 */
export const clearExpiredLocks = async () => {
  const result = await Seat.updateMany(
    { status: SEAT_STATUS.LOCKED, lockedUntil: { $lte: new Date() } },
    { status: SEAT_STATUS.AVAILABLE, lockedBy: null, lockedUntil: null }
  );
  if (result.modifiedCount > 0) {
    logger.info(`[Job] Cleared ${result.modifiedCount} expired seat locks`);
  }
  return result.modifiedCount;
};
