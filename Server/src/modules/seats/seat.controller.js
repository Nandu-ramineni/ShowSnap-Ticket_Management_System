import * as seatService from './seat.service.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';

export const getSeatMap = async (req, res, next) => {
  try {
    const rows = await seatService.getSeatMap(req.params.showtimeId);
    sendSuccess(res, { rows });
  } catch (e) { next(e); }
};

export const lockSeats = async (req, res, next) => {
  try {
    const { seatIds } = req.body;
    if (!Array.isArray(seatIds) || !seatIds.length) throw ApiError.badRequest('seatIds array required');
    const result = await seatService.lockSeats(req.params.showtimeId, seatIds, req.user.id);
    sendSuccess(res, result, 'Seats locked. Complete booking within 10 minutes.');
  } catch (e) { next(e); }
};

export const releaseSeats = async (req, res, next) => {
  try {
    const { seatIds } = req.body;
    await seatService.releaseSeats(req.params.showtimeId, seatIds, req.user.id);
    sendSuccess(res, null, 'Seats released');
  } catch (e) { next(e); }
};
