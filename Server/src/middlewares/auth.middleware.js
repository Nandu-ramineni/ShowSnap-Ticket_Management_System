import jwt from 'jsonwebtoken';
import ApiError from '../utils/ApiError.js';
import env from '../config/env.js';
import { ROLES } from '../utils/constants.js';

// ─── authenticate ─────────────────────────────────────────────────────────────

export const authenticate = (req, _res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw ApiError.unauthorized('No token provided');

    const token = header.split(' ')[1];

    // FIX 1: Pin the algorithm explicitly.
    // Without this, an attacker can set `alg: none` in the token header and
    // some jwt implementations will skip signature verification entirely.
    //
    // FIX 2: Verify issuer and audience — these were set during signing
    // (issuer: 'seatsecure') but never checked on the way in. A token from
    // another service sharing the same secret would otherwise pass through.
    const decoded = jwt.verify(token, env.jwt.secret, {
      algorithms: ['HS256'],
      issuer:     env.jwt.issuer,
      audience:   env.jwt.audience,
    });

    // FIX 3: Normalize the payload onto req.user.
    // signAccessToken() uses the standard `sub` claim for the user ID, but
    // every controller reads req.user.id — without this mapping, req.user.id
    // is undefined in every single protected route and you'd never notice
    // until a getProfile() or similar silently returns null.
    req.user = {
      id:    decoded.sub,
      email: decoded.email,
      role:  decoded.role,
    };

    next();
  } catch (err) {
    // FIX 4: Differentiate JWT error types rather than swallowing them all
    // into a generic error. The client needs to know whether to refresh
    // (token expired) or re-login (token invalid/tampered).
    if (err instanceof jwt.TokenExpiredError) {
      return next(ApiError.unauthorized('Access token expired'));
    }
    if (err instanceof jwt.JsonWebTokenError) {
      // Covers: invalid signature, malformed token, alg:none, wrong issuer/audience.
      // Deliberately vague to the client — don't leak which check failed.
      return next(ApiError.unauthorized('Invalid token'));
    }
    // Any other error (ApiError from the header check above, or unexpected) passes through.
    next(err);
  }
};

// ─── authorize ────────────────────────────────────────────────────────────────

// Usage:
//   router.get('/admin/x', authenticate, authorize(ROLES.ADMIN), handler)
//   router.get('/shared',  authenticate, authorize(ROLES.ADMIN, ROLES.THEATRE_OWNER), handler)
//
// Must always follow authenticate — it reads req.user which authenticate sets.

export const authorize = (...roles) => (req, _res, next) => {
  if (!req.user) {
    // Defensive: means authorize() was used without authenticate() before it.
    return next(ApiError.unauthorized('Authentication required'));
  }
  if (!roles.includes(req.user.role)) {
    return next(ApiError.forbidden('You do not have permission to access this resource'));
  }
  next();
};

// ─── Shorthand guards ─────────────────────────────────────────────────────────
//
// These only cover the RBAC check — they still need `authenticate` before
// them in the route chain. They don't call authenticate internally because
// that would prevent you from swapping the authentication strategy later.
//
// Correct:   router.delete('/x', authenticate, isAdmin, handler)
// Incorrect: router.delete('/x', isAdmin, handler)  ← req.user will be undefined

export const isAdmin        = authorize(ROLES.ADMIN);
export const isOwner        = authorize(ROLES.THEATRE_OWNER);
export const isAdminOrOwner = authorize(ROLES.ADMIN, ROLES.THEATRE_OWNER);