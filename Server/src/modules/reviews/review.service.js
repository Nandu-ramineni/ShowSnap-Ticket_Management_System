import Review from './review.model.js';
import Booking from '../bookings/booking.model.js';
import { recalculateRating } from '../movies/movie.service.js';
import ApiError from '../../utils/ApiError.js';
import { BOOKING_STATUS } from '../../utils/constants.js';

export const createReview = async (userId, { movieId, bookingId, rating, title, body, isSpoiler }) => {
  // User must have a confirmed booking for this movie
  const booking = await Booking.findOne({
    _id:    bookingId,
    user:   userId,
    movie:  movieId,
    status: BOOKING_STATUS.CONFIRMED,
  });
  if (!booking) throw ApiError.forbidden('You must have watched this movie to review it');

  const existing = await Review.findOne({ user: userId, movie: movieId });
  if (existing) throw ApiError.conflict('You have already reviewed this movie');

  const review = await Review.create({ user: userId, movie: movieId, booking: bookingId, rating, title, body, isSpoiler });

  // Recalculate movie rating asynchronously
  recalculateRating(movieId).catch(() => {});

  return review;
};

export const getMovieReviews = async (movieId, { page, limit, skip }) => {
  const [reviews, total] = await Promise.all([
    Review.find({ movie: movieId, isVisible: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name avatar')
      .lean(),
    Review.countDocuments({ movie: movieId, isVisible: true }),
  ]);
  return { reviews, total };
};

export const deleteReview = async (reviewId, userId, role) => {
  const review = await Review.findById(reviewId);
  if (!review) throw ApiError.notFound('Review not found');
  if (role !== 'admin' && review.user.toString() !== userId) {
    throw ApiError.forbidden('Not authorized');
  }
  await review.deleteOne();
  recalculateRating(review.movie).catch(() => {});
};
