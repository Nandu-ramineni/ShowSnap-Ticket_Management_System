import * as ActionTypes from '../Constants/authConstants';

/**
 * State shape matches every selector in authSelectors.js:
 *
 *   selectIsAuthenticated  → state.auth.isAuthenticated
 *   selectCurrentUser      → state.auth.user
 *   selectAuthLoading      → state.auth.isLoading
 *   selectIsHydrating      → state.auth.isHydrating
 *   selectAuthError        → state.auth.error
 *   selectSignupSuccess    → state.auth.signupSuccess
 */
const initialState = {
    isHydrating: true,       // true until hydrateAuth() completes on app boot
    isLoading: false,        // true during login / signup API calls
    isAuthenticated: false,
    user: null,
    error: null,
    signupSuccess: false,
};

export const authReducer = (state = initialState, action) => {
    switch (action.type) {

        // ── Login ─────────────────────────────────────────────────────────────
        case ActionTypes.AUTH_LOGIN_REQUEST:
            return { ...state, isLoading: true, error: null };

        case ActionTypes.AUTH_LOGIN_SUCCESS:
            return {
                ...state,
                isLoading: false,
                isAuthenticated: true,
                user: action.payload,
                error: null,
            };

        case ActionTypes.AUTH_LOGIN_FAILURE:
            return {
                ...state,
                isLoading: false,
                isAuthenticated: false,
                user: null,
                error: action.payload,
            };

        // ── Signup ────────────────────────────────────────────────────────────
        case ActionTypes.AUTH_SIGNUP_REQUEST:
            return { ...state, isLoading: true, error: null, signupSuccess: false };

        case ActionTypes.AUTH_SIGNUP_SUCCESS:
            return { ...state, isLoading: false, signupSuccess: true, error: null };

        case ActionTypes.AUTH_SIGNUP_FAILURE:
            return { ...state, isLoading: false, signupSuccess: false, error: action.payload };

        // ── Hydration (restoring session on page refresh) ─────────────────────
        case ActionTypes.AUTH_HYDRATE_REQUEST:
            return { ...state, isHydrating: true };

        case ActionTypes.AUTH_HYDRATE_SUCCESS:
            return {
                ...state,
                isHydrating: false,
                isAuthenticated: true,
                user: action.payload,
                error: null,
            };

        case ActionTypes.AUTH_HYDRATE_FAILURE:
            return {
                ...state,
                isHydrating: false,
                isAuthenticated: false,
                user: null,
            };

        // ── Token refreshed (axios interceptor updates store) ─────────────────
        case ActionTypes.AUTH_TOKEN_REFRESHED:
            // Optionally update user if new data is returned
            return state;

        // ── Logout ────────────────────────────────────────────────────────────
        case ActionTypes.AUTH_LOGOUT:
            return {
                ...initialState,
                isHydrating: false, // prevent re-hydration loop after logout
            };

        // ── Misc ──────────────────────────────────────────────────────────────
        case ActionTypes.AUTH_CLEAR_ERROR:
            return { ...state, error: null };

        default:
            return state;
    }
};