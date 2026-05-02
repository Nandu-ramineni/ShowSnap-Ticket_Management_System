import { validationResult } from 'express-validator';
import ApiError from './ApiError.js';

// FIX: was (req) — missing (res, next) so it never called next() on success.
// Express middleware MUST call next() to continue the chain. The old signature
// meant every validated route hung forever waiting for a response that never came.
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(ApiError.badRequest('Validation failed', errors.array()));
    // FIX: was `throw ApiError.badRequest(...)` — throwing inside middleware
    // that isn't wrapped in asyncHandler is unreliable in Express 4.
    // Always pass errors to next() so the error middleware handles them.
  }
  next();
};

export const paginate = (query) => {
  const page  = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(parseInt(query.limit, 10) || 20, 100);
  const skip  = (page - 1) * limit;
  return { page, limit, skip };
};