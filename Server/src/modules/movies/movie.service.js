import slugify from 'slugify';
import Movie from './movie.model.js';
import Showtime from '../showtimes/showtime.model.js';
import ApiError from '../../utils/ApiError.js';
import { setCache, getCache, deleteCache } from '../../config/redis.js';
import { REDIS_KEYS } from '../../utils/constants.js';

export const createMovie = async (data) => {
  data.slug = slugify(data.title, { lower: true, strict: true });
  const existing = await Movie.findOne({ slug: data.slug });
  if (existing) data.slug = `${data.slug}-${Date.now()}`;
  return Movie.create(data);
};

export const listMovies = async ({ page, limit, skip, city, date, genre, language, search, featured }) => {
  const filter = { isActive: true };

  if (genre)    filter.genres = genre;
  if (language) filter.language = language;
  if (featured) filter.isFeatured = true;
  if (search)   filter.$text = { $search: search };

  // Filter only movies that have shows in the requested city on the requested date
  if (city || date) {
    const showtimeFilter = { status: 'scheduled' };
    if (date) showtimeFilter.date = date;
    if (city) {
      const Theatre = (await import('../theatres/theatre.model.js')).default;
      const theatres = await Theatre.find({ 'location.city': new RegExp(city, 'i'), isActive: true }).select('_id');
      showtimeFilter.theatre = { $in: theatres.map((t) => t._id) };
    }
    const movieIds = await Showtime.distinct('movie', showtimeFilter);
    filter._id = { $in: movieIds };
  }

  const [movies, total] = await Promise.all([
    Movie.find(filter).sort({ releaseDate: -1 }).skip(skip).limit(limit).lean(),
    Movie.countDocuments(filter),
  ]);
  return { movies, total };
};

export const getMovieBySlug = async (slug) => {
  const cacheKey = `${REDIS_KEYS.MOVIE_CACHE}${slug}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const movie = await Movie.findOne({ slug, isActive: true }).lean();
  if (!movie) throw ApiError.notFound('Movie not found');

  await setCache(cacheKey, movie, 300);
  return movie;
};

export const getMovieById = async (id) => {
  const movie = await Movie.findById(id);
  if (!movie) throw ApiError.notFound('Movie not found');
  return movie;
};

export const updateMovie = async (id, data) => {
  const movie = await Movie.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!movie) throw ApiError.notFound('Movie not found');
  await deleteCache(`${REDIS_KEYS.MOVIE_CACHE}${movie.slug}`);
  return movie;
};

export const deleteMovie = async (id) => {
  const movie = await Movie.findByIdAndUpdate(id, { isActive: false }, { new: true });
  if (!movie) throw ApiError.notFound('Movie not found');
  await deleteCache(`${REDIS_KEYS.MOVIE_CACHE}${movie.slug}`);
};

/** Get cities + dates where this movie is playing */
export const getMovieAvailability = async (movieId) => {
  const showtimes = await Showtime.find({ movie: movieId, status: 'scheduled', startTime: { $gte: new Date() } })
    .populate('theatre', 'location.city')
    .lean();

  const cities = [...new Set(showtimes.map((s) => s.theatre?.location?.city).filter(Boolean))];
  const dates  = [...new Set(showtimes.map((s) => s.date))].sort();
  return { cities, dates };
};

/** Update app rating after new review */
export const recalculateRating = async (movieId) => {
  const Review = (await import('../reviews/review.model.js')).default;
  const result = await Review.aggregate([
    { $match: { movie: movieId, isVisible: true } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  if (result.length) {
    await Movie.findByIdAndUpdate(movieId, {
      appRating: Math.round(result[0].avg * 10) / 10,
      totalRatings: result[0].count,
    });
  }
};
