import {
    AUTH_LOGIN_REQUEST,
    AUTH_LOGIN_SUCCESS,
    AUTH_LOGIN_FAILURE,
    AUTH_SIGNUP_REQUEST,
    AUTH_SIGNUP_SUCCESS,
    AUTH_SIGNUP_FAILURE,
    AUTH_LOGOUT,
    AUTH_CLEAR_ERROR,
    AUTH_HYDRATE_REQUEST,
    AUTH_HYDRATE_SUCCESS,
    AUTH_HYDRATE_FAILURE,
} from '../Constants/authConstants';

/**
 * IMPORTANT: We do NOT touch localStorage or sessionStorage here.
 * The server issues HttpOnly cookies (accessToken, refreshToken) on login.
 * The browser attaches them automatically on every request via credentials:'include'.
 * Redux only holds in-memory user data + derived auth state — nothing sensitive.
 */
const initialState = {
    user:          null,    // populated after login or /me hydration
    isAuthenticated: false,
    isLoading:     false,   // login / signup in-flight
    isHydrating:   true,    // true until /me check resolves on app boot
    error:         null,
    signupSuccess: false,
};

const authReducer = (state = initialState, action) => {
    switch (action.type) {

        // ── Login ────────────────────────────────────────────────────────────
        case AUTH_LOGIN_REQUEST:
            return { ...state, isLoading: true, error: null, signupSuccess: false };

        case AUTH_LOGIN_SUCCESS:
            return {
                ...state,
                isLoading:       false,
                isAuthenticated: true,
                user:            action.payload.user,
                error:           null,
            };

        case AUTH_LOGIN_FAILURE:
            return { ...state, isLoading: false, isAuthenticated: false, error: action.payload };

        // ── Signup ───────────────────────────────────────────────────────────
        case AUTH_SIGNUP_REQUEST:
            return { ...state, isLoading: true, error: null, signupSuccess: false };

        case AUTH_SIGNUP_SUCCESS:
            return { ...state, isLoading: false, signupSuccess: true, error: null };

        case AUTH_SIGNUP_FAILURE:
            return { ...state, isLoading: false, error: action.payload };

        // ── Session hydration on boot (/me) ──────────────────────────────────
        case AUTH_HYDRATE_REQUEST:
            return { ...state, isHydrating: true };

        case AUTH_HYDRATE_SUCCESS:
            return {
                ...state,
                isHydrating:     false,
                isAuthenticated: true,
                user:            action.payload.user,
                error:           null,
            };

        case AUTH_HYDRATE_FAILURE:
            // No active session — that's fine, not an error
            return { ...state, isHydrating: false, isAuthenticated: false, user: null };

        // ── Logout ───────────────────────────────────────────────────────────
        case AUTH_LOGOUT:
            return { ...initialState, isHydrating: false };

        // ── Misc ─────────────────────────────────────────────────────────────
        case AUTH_CLEAR_ERROR:
            return { ...state, error: null };

        default:
            return state;
    }
};

export default authReducer;
