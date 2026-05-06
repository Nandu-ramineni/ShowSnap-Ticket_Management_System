/**
 * lib/axiosInstance.js
 *
 * Production-grade Axios instance with:
 *  ✔ Base URL from env variable
 *  ✔ Request interceptor: attaches access token from cookies
 *  ✔ Response interceptor: handles 401 → token refresh → retry
 *  ✔ Refresh queue: if N requests fail simultaneously, only ONE refresh
 *    call is made; the rest are queued and replayed once the new token arrives
 *  ✔ Force logout: dispatches AUTH_LOGOUT to Redux + redirects on refresh failure
 */

import axios from 'axios';
import Cookies from 'js-cookie';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

// ─── Axios instance ───────────────────────────────────────────────────────────
const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    timeout: 15_000,
});

// ─── Request interceptor ─────────────────────────────────────────────────────
api.interceptors.request.use(
    (config) => {
        const token = Cookies.get('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ─── Refresh queue ────────────────────────────────────────────────────────────
let isRefreshing = false;
let pendingQueue = [];   // [{ resolve, reject }]

/**
 * Flush the queue after a refresh attempt.
 * @param {Error|null} error   - null on success, Error on failure
 * @param {string|null} token  - new access token on success
 */
const flushQueue = (error, token = null) => {
    pendingQueue.forEach(({ resolve, reject }) =>
        error ? reject(error) : resolve(token)
    );
    pendingQueue = [];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const cookieOptions = {
    expires: 1,
    secure: window.location.protocol === 'https:',
    sameSite: 'Strict',
};

/** Hard-logout: wipe local state + Redux + redirect */
const forceLogout = async () => {
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    localStorage.removeItem('authUser');

    // Lazy-import to break the circular-dependency chain
    // (store → axiosInstance → store would be circular if eager)
    const [{ default: store }, { AUTH_LOGOUT }] = await Promise.all([
        import('@/Redux/store'),
        import('@/Redux/Constants/authConstants'),
    ]);
    store.dispatch({ type: AUTH_LOGOUT });

    window.location.replace('/login');
};

// ─── Response interceptor ────────────────────────────────────────────────────
api.interceptors.response.use(
    (response) => response,

    async (error) => {
        const originalRequest = error.config;

        // Only handle 401 errors that haven't already been retried
        if (error.response?.status !== 401 || originalRequest._retry) {
            return Promise.reject(error);
        }

        // If a refresh is already in-flight, queue this request
        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                pendingQueue.push({ resolve, reject });
            }).then((newToken) => {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
            });
        }

        // ── Start refresh ─────────────────────────────────────────────────
        originalRequest._retry = true;
        isRefreshing = true;

        try {
            const refreshToken = Cookies.get('refreshToken');
            if (!refreshToken) throw new Error('No refresh token available');

            const { data } = await axios.post(
                `${BASE_URL}/auth/refresh`,
                { refreshToken },
                { withCredentials: true }
            );

            const newAccessToken = data.data.accessToken;

            // Persist the rotated token
            Cookies.set('accessToken', newAccessToken, cookieOptions);

            // Update default header so future requests don't need another refresh
            api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;

            // Replay all queued requests with the new token
            flushQueue(null, newAccessToken);

            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return api(originalRequest);

        } catch (refreshError) {
            flushQueue(refreshError, null);
            await forceLogout();
            return Promise.reject(refreshError);

        } finally {
            isRefreshing = false;
        }
    }
);

export default api;