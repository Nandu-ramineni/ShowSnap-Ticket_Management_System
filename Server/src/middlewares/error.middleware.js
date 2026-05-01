import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';
import env from '../config/env.js';

const normalizeError = (err) => {
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return ApiError.badRequest('Validation failed', errors);
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return ApiError.conflict(`${field} already exists`);
  }
  if (err.name === 'CastError')            return ApiError.badRequest(`Invalid ${err.path}`);
  if (err.name === 'JsonWebTokenError')    return ApiError.unauthorized('Invalid token');
  if (err.name === 'TokenExpiredError')    return ApiError.unauthorized('Token expired');
  return err;
};

export const notFoundHandler = (req, res, next) =>
  next(ApiError.notFound(`${req.method} ${req.originalUrl} not found`));

export const errorHandler = (err, req, res, next) => {
  const normalized = normalizeError(err);
  const statusCode = normalized.statusCode || 500;

  if (statusCode >= 500) {
    logger.error({ message: err.message, stack: err.stack, url: req.originalUrl, method: req.method });
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message:  normalized.message || 'Internal server error',
    errors:   normalized.errors  || [],
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
