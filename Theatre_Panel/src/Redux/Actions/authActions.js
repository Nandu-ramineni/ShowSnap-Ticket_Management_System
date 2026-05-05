/**
 * Redux/Actions/authActions.js
 *
 * All network calls go through the shared axiosInstance which already:
 *   • sets withCredentials: true  (HttpOnly cookies sent automatically)
 *   • sets Content-Type / Accept headers
 *   • normalises error messages in its response interceptor
 *
 * Action files therefore only contain dispatch logic — zero HTTP plumbing.
 */

import axiosInstance from '@/lib/axiosInstance';
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

// ── Session hydration ────────────────────────────────────────────────────────
/**
 * Called once on app boot from AuthContext.
 * GET /auth/me — the server validates the HttpOnly cookie and returns the
 * user object if the session is still alive.
 * This is the ONLY mechanism to restore auth state after a hard refresh.
 * No localStorage, no manual cookie reads.
 */
export const hydrateSession = () => async (dispatch) => {
    dispatch({ type: AUTH_HYDRATE_REQUEST });
    try {
        const { data } = await axiosInstance.get('/auth/me');

        if (data.success && data.data?.user) {
            dispatch({ type: AUTH_HYDRATE_SUCCESS, payload: { user: data.data.user } });
        } else {
            dispatch({ type: AUTH_HYDRATE_FAILURE });
        }
    } catch {
        // 401 or network error — no active session, that is fine
        dispatch({ type: AUTH_HYDRATE_FAILURE });
    }
};

// ── Login ────────────────────────────────────────────────────────────────────
/**
 * POST /auth/login
 * The server validates credentials and responds by:
 *   1. Setting HttpOnly accessToken + refreshToken cookies
 *   2. Returning the user profile in the body
 * We store only the user profile in Redux — tokens never touch JS land.
 *
 * Returns { success: boolean, message?: string } so the Login component
 * can react to the outcome without reading Redux state in a callback.
 */
export const loginUser = (credentials) => async (dispatch) => {
    dispatch({ type: AUTH_LOGIN_REQUEST });
    try {
        const { data } = await axiosInstance.post('/auth/login', credentials);

        if (!data.success) {
            const msg = data.message || 'Login failed. Please try again.';
            dispatch({ type: AUTH_LOGIN_FAILURE, payload: msg });
            return { success: false, message: msg };
        }

        dispatch({ type: AUTH_LOGIN_SUCCESS, payload: { user: data.data.user } });
        return { success: true };

    } catch (error) {
        const message = error.message || 'Network error. Please try again.';
        dispatch({ type: AUTH_LOGIN_FAILURE, payload: message });
        return { success: false, message };
    }
};

// ── Signup ───────────────────────────────────────────────────────────────────
/**
 * POST /auth/signup
 * On success the user is NOT automatically logged in — they are redirected
 * to /login so they go through the explicit login flow (matches most UX
 * patterns and avoids auto-issuing a session on fresh accounts).
 * Adjust the reducer / component if your backend auto-logs-in on signup.
 */
export const signupUser = (userData) => async (dispatch) => {
    dispatch({ type: AUTH_SIGNUP_REQUEST });
    try {
        const { data } = await axiosInstance.post('/auth/signup', userData);

        if (!data.success) {
            const msg = data.message || 'Signup failed. Please try again.';
            dispatch({ type: AUTH_SIGNUP_FAILURE, payload: msg });
            return { success: false, message: msg };
        }

        dispatch({ type: AUTH_SIGNUP_SUCCESS });
        return { success: true };

    } catch (error) {
        const message = error.message || 'Network error. Please try again.';
        dispatch({ type: AUTH_SIGNUP_FAILURE, payload: message });
        return { success: false, message };
    }
};

// ── Logout ───────────────────────────────────────────────────────────────────
/**
 * POST /auth/logout
 * Tells the server to clear / invalidate the HttpOnly cookies server-side.
 * We dispatch AUTH_LOGOUT regardless of the server response — if the server
 * is down the user should still be able to leave the authenticated state
 * on the client.
 */
export const logoutUser = () => async (dispatch) => {
    try {
        await axiosInstance.post('/auth/logout');
    } catch {
        // Server error or offline — intentionally swallowed.
        // Client state must still be cleared so the user is not stuck.
    } finally {
        dispatch({ type: AUTH_LOGOUT });
    }
};

// ── Misc ─────────────────────────────────────────────────────────────────────
export const clearAuthError = () => ({ type: AUTH_CLEAR_ERROR });