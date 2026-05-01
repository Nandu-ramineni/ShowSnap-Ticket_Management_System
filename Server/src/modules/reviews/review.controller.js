import * as reviewService from './review.service.js';
import { sendSuccess, sendCreated, sendNoContent, sendPaginated } from '../../utils/ApiResponse.js';
import { paginate } from '../../utils/validate.js';

export const createReview = async (req, res, next) => {
  try {
    const review = await reviewService.createReview(req.user.id, { ...req.body, movieId: req.params.movieId });
    sendCreated(res, { review }, 'Review submitted');
  } catch (e) { next(e); }
};

export const getMovieReviews = async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const { reviews, total } = await reviewService.getMovieReviews(req.params.movieId, { page, limit, skip });
    sendPaginated(res, reviews, { total, page, limit });
  } catch (e) { next(e); }
};

export const deleteReview = async (req, res, next) => {
  try {
    await reviewService.deleteReview(req.params.id, req.user.id, req.user.role);
    sendNoContent(res);
  } catch (e) { next(e); }
};
