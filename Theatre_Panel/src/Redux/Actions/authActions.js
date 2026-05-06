import Cookies from 'js-cookie';
import api from '@/lib/axiosInstance';
import * as ActionTypes from '../Constants/authConstants';

// ─── Cookie options ───────────────────────────────────────────────────────────
const cookieOptions = (days) => ({
    expires: days,
    secure: window.location.protocol === 'https:',
    sameSite: 'Strict',
});

// ─── Login ────────────────────────────────────────────────────────────────────
/**
 * POST /auth/login
 * On success  : stores tokens in cookies + user in localStorage, dispatches SUCCESS
 * On failure  : dispatches FAILURE with the server error message
 */
export const login = (email, password) => async (dispatch) => {
    try {
        dispatch({ type: ActionTypes.AUTH_LOGIN_REQUEST });

        const { data } = await api.post('/auth/login', { email, password });
        const { accessToken, refreshToken, user } = data.data;

        // ── Persist tokens ──────────────────────────────────────────────────
        Cookies.set('accessToken', accessToken, cookieOptions(1));     // 1 day
        Cookies.set('refreshToken', refreshToken, cookieOptions(7));   // 7 days

        // ── Persist user for hydration across page refreshes ────────────────
        localStorage.setItem('authUser', JSON.stringify(user));

        dispatch({
            type: ActionTypes.AUTH_LOGIN_SUCCESS,
            payload: user,
        });
    } catch (error) {
        dispatch({
            type: ActionTypes.AUTH_LOGIN_FAILURE,
            payload:
                error.response?.data?.message ||
                'Login failed. Please check your credentials and try again.',
        });
    }
};

// ─── Logout ───────────────────────────────────────────────────────────────────
/**
 * Clears cookies, localStorage, and resets Redux state.
 * Optionally call the server-side logout endpoint if one exists.
 */
export const logout = () => (dispatch) => {
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    localStorage.removeItem('authUser');
    dispatch({ type: ActionTypes.AUTH_LOGOUT });
};

// ─── Hydrate session on page refresh ─────────────────────────────────────────
/**
 * Called once in App.jsx on mount.
 * Restores Redux auth state from the access-token cookie + localStorage user,
 * so the user stays logged in across hard refreshes without an extra API round-trip.
 */
export const hydrateAuth = () => (dispatch) => {
    dispatch({ type: ActionTypes.AUTH_HYDRATE_REQUEST });

    const token = Cookies.get('accessToken');
    const raw = localStorage.getItem('authUser');

    if (token && raw) {
        try {
            const user = JSON.parse(raw);
            dispatch({ type: ActionTypes.AUTH_HYDRATE_SUCCESS, payload: user });
        } catch {
            // Corrupt localStorage — force a clean state
            Cookies.remove('accessToken');
            Cookies.remove('refreshToken');
            localStorage.removeItem('authUser');
            dispatch({ type: ActionTypes.AUTH_HYDRATE_FAILURE });
        }
    } else {
        dispatch({ type: ActionTypes.AUTH_HYDRATE_FAILURE });
    }
};

// ─── Clear error banner ───────────────────────────────────────────────────────
export const clearAuthError = () => ({ type: ActionTypes.AUTH_CLEAR_ERROR });