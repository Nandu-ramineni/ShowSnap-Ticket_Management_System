import * as movieService from './movie.service.js';
import { sendSuccess, sendCreated, sendNoContent, sendPaginated } from '../../utils/ApiResponse.js';
import { validate, paginate } from '../../utils/validate.js';

export const listMovies = async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const { movies, total } = await movieService.listMovies({ ...req.query, page, limit, skip });
    sendPaginated(res, movies, { total, page, limit });
  } catch (e) { next(e); }
};

export const getMovieBySlug = async (req, res, next) => {
  try {
    const movie = await movieService.getMovieBySlug(req.params.slug);
    sendSuccess(res, { movie });
  } catch (e) { next(e); }
};

export const getMovieAvailability = async (req, res, next) => {
  try {
    const data = await movieService.getMovieAvailability(req.params.id);
    sendSuccess(res, data);
  } catch (e) { next(e); }
};

export const createMovie = async (req, res, next) => {
  try {
    validate(req);
    const movie = await movieService.createMovie(req.body);
    sendCreated(res, { movie }, 'Movie created');
  } catch (e) { next(e); }
};

export const updateMovie = async (req, res, next) => {
  try {
    const movie = await movieService.updateMovie(req.params.id, req.body);
    sendSuccess(res, { movie }, 'Movie updated');
  } catch (e) { next(e); }
};

export const deleteMovie = async (req, res, next) => {
  try {
    await movieService.deleteMovie(req.params.id);
    sendNoContent(res);
  } catch (e) { next(e); }
};
