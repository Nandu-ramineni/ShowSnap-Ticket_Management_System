import mongoose from 'mongoose';
import Booking from './booking.model.js';
import Seat from '../seats/seat.model.js';
import Showtime from '../showtimes/showtime.model.js';
import { confirmSeats, releaseBookedSeats } from '../seats/seat.service.js';
import { updateSeatCounts } from '../showtimes/showtime.service.js';
import { createPaymentIntent, retrievePaymentIntent, createRefund } from '../payments/payment.service.js';
import ApiError from '../../utils/ApiError.js';
import { BOOKING_STATUS, PAYMENT_STATUS, SEAT_STATUS } from '../../utils/constants.js';
import logger from '../../utils/logger.js';

const CONVENIENCE_FEE_PERCENT = 0.02; // 2%
const TAX_PERCENT             = 0.18; // 18% GST
const LOYALTY_EARN_RATE       = 1;    // 1 point per ₹10 spent

/**
 * Initiate booking — validate locked seats, create Stripe PaymentIntent
 */
export const initiateBooking = async (userId, { showtimeId, seatIds, couponCode }) => {
  const showtime = await Showtime.findById(showtimeId)
    .populate('movie',   'title duration')
    .populate('theatre', 'name location')
    .populate('screen',  'name screenType');

  if (!showtime) throw ApiError.notFound('Showtime not found');
  if (showtime.status !== 'scheduled') throw ApiError.conflict('This show is no longer available');

  // Verify seats are locked by this user
  const seats = await Seat.find({
    _id:      { $in: seatIds },
    showtime: showtimeId,
    lockedBy: userId,
    status:   SEAT_STATUS.LOCKED,
  });

  if (seats.length !== seatIds.length) {
    throw ApiError.conflict('Seat lock expired or invalid. Please select seats again.');
  }

  const subtotal         = seats.reduce((sum, s) => sum + s.price, 0);
  const convenienceFee   = Math.round(subtotal * CONVENIENCE_FEE_PERCENT);
  const taxableAmount    = subtotal + convenienceFee;
  const taxes            = Math.round(taxableAmount * TAX_PERCENT);
  const totalAmount      = taxableAmount + taxes;

  // TODO: Apply coupon discount here

  const { paymentIntentId, clientSecret } = await createPaymentIntent(
    totalAmount / 100, // in rupees (prices stored in paise)
    'inr',
    { userId, showtimeId, seatIds: seatIds.join(',') }
  );

  const booking = await Booking.create({
    user:      userId,
    movie:     showtime.movie._id,
    theatre:   showtime.theatre._id,
    screen:    showtime.screen._id,
    showtime:  showtimeId,
    seats:     seatIds,
    seatSnapshot: seats.map((s) => ({ label: s.label, type: s.type, price: s.price })),
    subtotal,
    convenienceFee,
    taxes,
    totalAmount,
    currency: 'INR',
    couponCode,
    stripePaymentIntentId: paymentIntentId,
    stripeClientSecret:    clientSecret,
    status:        BOOKING_STATUS.PENDING,
    paymentStatus: PAYMENT_STATUS.PENDING,
    meta: {
      movieTitle:  showtime.movie.title,
      theatreName: showtime.theatre.name,
      showDate:    showtime.date,
      showTime:    showtime.startTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      screenName:  showtime.screen.name,
      language:    showtime.language,
      format:      showtime.format,
    },
  });

  return { booking, clientSecret };
};

/**
 * Confirm booking after Stripe payment_intent.succeeded webhook
 * Uses MongoDB session for atomicity
 */
export const confirmBooking = async (paymentIntentId) => {
  const booking = await Booking.findOne({ stripePaymentIntentId: paymentIntentId });
  if (!booking) {
    logger.warn(`No booking found for paymentIntent: ${paymentIntentId}`);
    return null;
  }
  if (booking.status === BOOKING_STATUS.CONFIRMED) return booking; // Idempotent

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    booking.status        = BOOKING_STATUS.CONFIRMED;
    booking.paymentStatus = PAYMENT_STATUS.SUCCEEDED;
    booking.confirmedAt   = new Date();
    booking.loyaltyEarned = Math.floor(booking.totalAmount / 1000); // ₹10 = 1 point (prices in paise)
    await booking.save({ session });

    await confirmSeats(booking.seats, booking.user.toString(), booking._id, session);
    await updateSeatCounts(booking.showtime, booking.seats.length, session);

    // Award loyalty points
    const User = (await import('../auth/user.model.js')).default;
    await User.findByIdAndUpdate(
      booking.user,
      { $inc: { loyaltyPoints: booking.loyaltyEarned } },
      { session }
    );

    await session.commitTransaction();
    logger.info(`Booking ${booking.bookingRef} confirmed`);
    return booking;
  } catch (err) {
    await session.abortTransaction();
    logger.error(`confirmBooking failed for ${paymentIntentId}:`, err);
    throw err;
  } finally {
    session.endSession();
  }
};

export const getUserBookings = async (userId, { page, limit, skip }) => {
  const [bookings, total] = await Promise.all([
    Booking.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('movie',   'title posterUrl duration')
      .populate('theatre', 'name location')
      .populate('showtime','startTime date language format')
      .lean(),
    Booking.countDocuments({ user: userId }),
  ]);
  return { bookings, total };
};

export const getBookingById = async (bookingId, userId) => {
  const booking = await Booking.findOne({ _id: bookingId, user: userId })
    .populate('movie',    'title posterUrl duration certification')
    .populate('theatre',  'name location contactPhone')
    .populate('screen',   'name screenType')
    .populate('showtime', 'startTime date language format')
    .populate('seats',    'label type price');

  if (!booking) throw ApiError.notFound('Booking not found');
  return booking;
};

/**
 * Cancel and refund a booking
 */
export const cancelBooking = async (bookingId, userId) => {
  const booking = await Booking.findOne({ _id: bookingId, user: userId })
    .populate('theatre', 'cancellationPolicy')
    .populate('showtime', 'startTime');

  if (!booking) throw ApiError.notFound('Booking not found');
  if (booking.status !== BOOKING_STATUS.CONFIRMED) {
    throw ApiError.conflict('Only confirmed bookings can be cancelled');
  }

  const policy = booking.theatre.cancellationPolicy;
  if (!policy.allowed) throw ApiError.forbidden('This theatre does not allow cancellations');

  const hoursToShow = (new Date(booking.showtime.startTime) - new Date()) / 36e5;
  if (hoursToShow < policy.cutoffHours) {
    throw ApiError.conflict(`Cancellation not allowed within ${policy.cutoffHours} hours of showtime`);
  }

  const refundAmount = Math.round((booking.totalAmount * policy.refundPercentage) / 100);

  const refund = await createRefund(booking.stripePaymentIntentId, refundAmount / 100);

  booking.status        = BOOKING_STATUS.REFUNDED;
  booking.paymentStatus = PAYMENT_STATUS.REFUNDED;
  booking.refundId      = refund.id;
  booking.refundedAmount = refundAmount;
  booking.cancelledAt   = new Date();
  await booking.save();

  await releaseBookedSeats(booking.seats);
  await updateSeatCounts(booking.showtime._id, -booking.seats.length);

  // Reverse loyalty
  if (booking.loyaltyEarned > 0) {
    const User = (await import('../auth/user.model.js')).default;
    await User.findByIdAndUpdate(booking.user, {
      $inc: { loyaltyPoints: -booking.loyaltyEarned },
    });
  }

  logger.info(`Booking ${booking.bookingRef} cancelled, refund: ₹${refundAmount / 100}`);
  return { booking, refundAmount };
};

/** Reconcile pending bookings whose webhook may have been missed */
export const reconcilePendingBookings = async () => {
  const stale = await Booking.find({
    status:        BOOKING_STATUS.PENDING,
    paymentStatus: PAYMENT_STATUS.PENDING,
    createdAt:     { $lt: new Date(Date.now() - 2 * 60 * 1000) },
    stripePaymentIntentId: { $exists: true },
  }).limit(50);

  await Promise.allSettled(
    stale.map(async (b) => {
      const intent = await retrievePaymentIntent(b.stripePaymentIntentId);
      if (intent.status === 'succeeded') await confirmBooking(b.stripePaymentIntentId);
      else if (['canceled', 'requires_payment_method'].includes(intent.status)) {
        b.paymentStatus = PAYMENT_STATUS.FAILED;
        await b.save();
      }
    })
  );
};
