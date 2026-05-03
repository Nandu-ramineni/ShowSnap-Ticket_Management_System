import axios from 'axios';

/**
 * API client for all backend requests.
 *
 * Tokens live in httpOnly cookies — the browser attaches them automatically
 * on every same-origin request via `withCredentials: true`.
 * We never read tokens in JS; we never touch localStorage.
 *
 * For cross-origin deployments set NEXT_PUBLIC_API_URL to your backend and
 * ensure the backend responds with the correct CORS + credentials headers.
 */

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // sends cookies on every request automatically
});

// ─── Response interceptor — 401 means session expired ───────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Hit our own Next.js logout route so httpOnly cookies are cleared server-side
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
      window.location.replace('/login');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
