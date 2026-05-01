import rateLimit from 'express-rate-limit';
import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';

const limiter = (opts) =>
  rateLimit({
    standardHeaders: true,
    legacyHeaders:   false,
    handler: (req, res, next) => next(ApiError.tooMany()),
    ...opts,
  });

export const apiLimiter     = limiter({ windowMs: env.rateLimit.windowMs, max: env.rateLimit.max });
export const authLimiter    = limiter({ windowMs: 15 * 60 * 1000, max: 10 });
export const bookingLimiter = limiter({ windowMs: 60 * 1000, max: 20 });
