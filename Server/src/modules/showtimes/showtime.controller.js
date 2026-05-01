import * as showtimeService from './showtime.service.js';
import { sendSuccess, sendCreated } from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';

export const createShowtime = async (req, res, next) => {
  try {
    const showtime = await showtimeService.createShowtime(req.body);
    sendCreated(res, { showtime }, 'Showtime created');
  } catch (e) { next(e); }
};

export const getShowtimesForMovie = async (req, res, next) => {
  try {
    const { city, date } = req.query;
    if (!city || !date) throw ApiError.badRequest('city and date query params are required');
    const data = await showtimeService.getShowtimesForMovie(req.params.movieId, city, date);
    sendSuccess(res, data);
  } catch (e) { next(e); }
};

export const getShowtimeById = async (req, res, next) => {
  try {
    const showtime = await showtimeService.getShowtimeById(req.params.id);
    sendSuccess(res, { showtime });
  } catch (e) { next(e); }
};

export const cancelShowtime = async (req, res, next) => {
  try {
    const showtime = await showtimeService.cancelShowtime(req.params.id);
    sendSuccess(res, { showtime }, 'Showtime cancelled');
  } catch (e) { next(e); }
};
