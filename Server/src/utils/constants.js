export const ROLES = Object.freeze({
  USER:          'user',
  ADMIN:         'admin',
  THEATRE_OWNER: 'theatre_owner',
});

// Approval lifecycle — used only for theatre_owner accounts.
// Regular users and admins default to ACTIVE and never transition through this.
export const ACCOUNT_STATUS = Object.freeze({
  PENDING:  'pending',   // theatre_owner awaiting admin review
  ACTIVE:   'active',    // approved, or default for user/admin
  REJECTED: 'rejected',  // admin rejected the application
});

// Roles a client may request during public registration.
// 'admin' is intentionally excluded — use the seed script instead.
export const REGISTERABLE_ROLES = Object.freeze([
  ROLES.USER,
  ROLES.THEATRE_OWNER,
]);

export const SEAT_STATUS = Object.freeze({
  AVAILABLE: 'available',
  LOCKED:    'locked',
  BOOKED:    'booked',
  BLOCKED:   'blocked',
});

export const BOOKING_STATUS = Object.freeze({
  PENDING:   'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  REFUNDED:  'refunded',
});

export const PAYMENT_STATUS = Object.freeze({
  PENDING:   'pending',
  SUCCEEDED: 'succeeded',
  FAILED:    'failed',
  REFUNDED:  'refunded',
});

export const SEAT_TYPES = Object.freeze({
  RECLINER: 'recliner',
  PREMIUM:  'premium',
  GOLD:     'gold',
  SILVER:   'silver',
});

export const SCREEN_TYPES = Object.freeze({
  IMAX:     'IMAX',
  FOUR_DX:  '4DX',
  DOLBY:    'DOLBY',
  STANDARD: 'STANDARD',
  DRIVE_IN: 'DRIVE_IN',
});

export const LANGUAGES = Object.freeze([
  'English', 'Hindi', 'Tamil', 'Telugu',
  'Malayalam', 'Kannada', 'Bengali', 'Marathi',
]);

export const GENRES = Object.freeze([
  'Action', 'Comedy', 'Drama', 'Horror', 'Romance',
  'Thriller', 'Sci-Fi', 'Animation', 'Documentary', 'Fantasy',
]);

export const SHOW_STATUS = Object.freeze({
  SCHEDULED: 'scheduled',
  CANCELLED: 'cancelled',
  HOUSEFULL: 'housefull',
});

export const REDIS_KEYS = Object.freeze({
  SEAT_LOCK:      'seat:lock:',
  MOVIE_CACHE:    'cache:movie:',
  SHOWTIME_SEATS: 'cache:showtime:seats:',
  THEATRE_CACHE:  'cache:theatre:',
});

export const PAGINATION = Object.freeze({
  DEFAULT_PAGE:  1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT:     100,
});
// Onboarding lifecycle — tracks post-approval profile completion for TheatreOwner.
// pending_onboarding → owner approved but onboarding form not yet submitted.
// in_progress        → owner saved partial onboarding data (auto-set on first save).
// completed          → all required onboarding fields filled; owner is fully operational.
export const ONBOARDING_STATUS = Object.freeze({
  PENDING_ONBOARDING: 'pending_onboarding',
  IN_PROGRESS:        'in_progress',
  COMPLETED:          'completed',
});