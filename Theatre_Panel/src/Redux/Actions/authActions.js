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

const API_BASE = 'http://localhost:5000/api/v1';

/**
 * All requests use credentials: 'include' so the browser sends the
 * HttpOnly cookies the server set on login (accessToken, refreshToken).
 * We never read, write, or delete those cookies from JS.
 */
const apiFetch = (path, options = {}) =>
    fetch(`${API_BASE}${path}`, {
        credentials: 'include',          // ← sends & receives cookies
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
    });

const extractError = async (res) => {
    try {
        const body = await res.json();
        return body.message || body.error || `Request failed (${res.status})`;
    } catch {
        return `Request failed (${res.status})`;
    }
};

// ── Session hydration ────────────────────────────────────────────────────────
/**
 * Called once on app boot. Hits /me — the server validates the HttpOnly
 * accessToken cookie and returns the user object if the session is alive.
 * This is the ONLY way we restore auth state after a page refresh.
 */
export const hydrateSession = () => async (dispatch) => {
    dispatch({ type: AUTH_HYDRATE_REQUEST });
    try {
        const res = await apiFetch('/auth/me');
        if (!res.ok) {
            dispatch({ type: AUTH_HYDRATE_FAILURE });
            return;
        }
        const data = await res.json();
        if (data.success && data.data?.user) {
            dispatch({ type: AUTH_HYDRATE_SUCCESS, payload: { user: data.data.user } });
        } else {
            dispatch({ type: AUTH_HYDRATE_FAILURE });
        }
    } catch {
        // Network error or server down — treat as no session
        dispatch({ type: AUTH_HYDRATE_FAILURE });
    }
};

// ── Login ────────────────────────────────────────────────────────────────────
/**
 * POST /auth/login
 * Server responds with user JSON + sets HttpOnly cookies automatically.
 * We store only the user object in Redux (no tokens in JS land).
 */
export const loginUser = (credentials) => async (dispatch) => {
    dispatch({ type: AUTH_LOGIN_REQUEST });
    try {
        const res = await apiFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });

        if (!res.ok) {
            const message = await extractError(res);
            dispatch({ type: AUTH_LOGIN_FAILURE, payload: message });
            return { success: false, message };
        }

        const data = await res.json();
        if (!data.success) {
            const msg = data.message || 'Login failed';
            dispatch({ type: AUTH_LOGIN_FAILURE, payload: msg });
            return { success: false, message: msg };
        }

        // Cookies are set by the server — we only keep the user profile
        dispatch({ type: AUTH_LOGIN_SUCCESS, payload: { user: data.data.user } });
        return { success: true };
    } catch (err) {
        const message = err.message || 'Network error. Please try again.';
        dispatch({ type: AUTH_LOGIN_FAILURE, payload: message });
        return { success: false, message };
    }
};

// ── Signup ───────────────────────────────────────────────────────────────────
export const signupUser = (userData) => async (dispatch) => {
    dispatch({ type: AUTH_SIGNUP_REQUEST });
    try {
        const res = await apiFetch('/auth/signup', {
            method: 'POST',
            body: JSON.stringify(userData),
        });

        if (!res.ok) {
            const message = await extractError(res);
            dispatch({ type: AUTH_SIGNUP_FAILURE, payload: message });
            return { success: false, message };
        }

        const data = await res.json();
        if (!data.success) {
            const msg = data.message || 'Signup failed';
            dispatch({ type: AUTH_SIGNUP_FAILURE, payload: msg });
            return { success: false, message: msg };
        }

        dispatch({ type: AUTH_SIGNUP_SUCCESS });
        return { success: true };
    } catch (err) {
        const message = err.message || 'Network error. Please try again.';
        dispatch({ type: AUTH_SIGNUP_FAILURE, payload: message });
        return { success: false, message };
    }
};

// ── Logout ───────────────────────────────────────────────────────────────────
/**
 * POST /auth/logout — tells the server to clear the HttpOnly cookies.
 * We then clear Redux state. We never touch cookies from JS.
 */
export const logoutUser = () => async (dispatch) => {
    try {
        await apiFetch('/auth/logout', { method: 'POST' });
    } catch {
        // Even if the server call fails, clear client state
    } finally {
        dispatch({ type: AUTH_LOGOUT });
    }
};

// ── Misc ─────────────────────────────────────────────────────────────────────
export const clearAuthError = () => ({ type: AUTH_CLEAR_ERROR });
