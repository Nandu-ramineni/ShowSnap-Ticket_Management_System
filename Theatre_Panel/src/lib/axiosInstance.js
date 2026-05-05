/**
 * lib/axiosInstance.js
 *
 * Single shared Axios instance for the entire app.
 *
 * Security decisions:
 *  ✔ withCredentials: true  — the browser automatically attaches the
 *    HttpOnly accessToken / refreshToken cookies on every request.
 *    We never read, write, or delete those cookies from JS.
 *  ✔ baseURL pulled from an env variable so the value is baked in at
 *    build time and never hardcoded in source.
 *  ✔ Request interceptor sets Content-Type once, centrally — no risk
 *    of individual action files forgetting the header.
 *  ✔ Response interceptor normalises error messages so action files
 *    never have to parse raw Axios errors themselves.
 *  ✔ No Authorization header / Bearer token logic — cookies handle auth.
 *    If you later add token refresh, do it here in one place.
 */

import axios from 'axios';

// Vite exposes env vars as import.meta.env.VITE_*
// Create a .env file at the project root:  VITE_API_BASE_URL=http://localhost:5000/api/v1
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,              // sends & receives HttpOnly cookies
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    timeout: 15_000,                    // 15 s — surface network issues early
});

// ── Request interceptor ───────────────────────────────────────────────────────
// Clean hook for adding anything request-scoped later (e.g. CSRF tokens,
// request IDs for distributed tracing) without touching action files.
axiosInstance.interceptors.request.use(
    (config) => config,
    (error) => Promise.reject(error),
);

// ── Response interceptor ─────────────────────────────────────────────────────
// Normalise errors into a plain { message } shape so action files
// can always do `error.message` without worrying about Axios internals.
axiosInstance.interceptors.response.use(
    (response) => response,

    (error) => {
        // Server replied with a non-2xx status
        if (error.response) {
            const serverMsg =
                error.response.data?.message ||
                error.response.data?.error ||
                `Request failed (${error.response.status})`;

            return Promise.reject(new Error(serverMsg));
        }

        // Request was made but no response arrived (network down, CORS abort, timeout)
        if (error.request) {
            return Promise.reject(
                new Error('Network error. Check your connection and try again.'),
            );
        }

        // Something blew up before the request was even sent
        return Promise.reject(new Error(error.message || 'An unexpected error occurred.'));
    },
);

export default axiosInstance;