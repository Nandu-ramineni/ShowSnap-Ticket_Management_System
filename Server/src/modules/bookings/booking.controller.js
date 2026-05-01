import * as bookingService from './booking.service.js';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/ApiResponse.js';
import { paginate } from '../../utils/validate.js';

export const initiateBooking = async (req, res, next) => {
  try {
    const result = await bookingService.initiateBooking(req.user.id, req.body);
    sendCreated(res, result, 'Booking initiated. Complete payment to confirm.');
  } catch (e) { next(e); }
};

export const getMyBookings = async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const { bookings, total } = await bookingService.getUserBookings(req.user.id, { page, limit, skip });
    sendPaginated(res, bookings, { total, page, limit });
  } catch (e) { next(e); }
};

export const getBookingById = async (req, res, next) => {
  try {
    const booking = await bookingService.getBookingById(req.params.id, req.user.id);
    sendSuccess(res, { booking });
  } catch (e) { next(e); }
};

export const cancelBooking = async (req, res, next) => {
  try {
    const result = await bookingService.cancelBooking(req.params.id, req.user.id);
    sendSuccess(res, result, 'Booking cancelled');
  } catch (e) { next(e); }
};
