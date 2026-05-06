// ─── Login ────────────────────────────────────────────────────────────────────
export const AUTH_LOGIN_REQUEST = 'AUTH_LOGIN_REQUEST';
export const AUTH_LOGIN_SUCCESS = 'AUTH_LOGIN_SUCCESS';
export const AUTH_LOGIN_FAILURE = 'AUTH_LOGIN_FAILURE';

// ─── Signup ───────────────────────────────────────────────────────────────────
export const AUTH_SIGNUP_REQUEST = 'AUTH_SIGNUP_REQUEST';
export const AUTH_SIGNUP_SUCCESS = 'AUTH_SIGNUP_SUCCESS';
export const AUTH_SIGNUP_FAILURE = 'AUTH_SIGNUP_FAILURE';

// ─── Session hydration (cookie → Redux on page refresh) ──────────────────────
export const AUTH_HYDRATE_REQUEST = 'AUTH_HYDRATE_REQUEST';
export const AUTH_HYDRATE_SUCCESS = 'AUTH_HYDRATE_SUCCESS';
export const AUTH_HYDRATE_FAILURE = 'AUTH_HYDRATE_FAILURE';

// ─── Token refresh ────────────────────────────────────────────────────────────
export const AUTH_TOKEN_REFRESHED = 'AUTH_TOKEN_REFRESHED';

// ─── Session ──────────────────────────────────────────────────────────────────
export const AUTH_LOGOUT      = 'AUTH_LOGOUT';
export const AUTH_CLEAR_ERROR = 'AUTH_CLEAR_ERROR';