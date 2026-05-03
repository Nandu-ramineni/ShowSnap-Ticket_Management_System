import axios from 'axios';
import {
  loginStart,
  loginSuccess,
  loginFailure,
  logoutSuccess,
  registerStart,
  registerSuccess,
  registerFailure,
} from '../Reducers/auth.reducers';
import { setAuthCookies, clearAuthCookies, getCookie, COOKIE } from '@/lib/cookies';
import type { AppDispatch } from '../store';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

// ─── Login ────────────────────────────────────────────────────────────────────
export const Client_Login =
  (credentials: { email: string; password: string }) =>
  async (dispatch: AppDispatch) => {
    try {
      dispatch(loginStart());

      // Hit backend directly — no Next.js proxy needed
      const { data } = await axios.post(`${API_BASE_URL}/auth/login`, credentials);

      const { user, accessToken, refreshToken } = data.data;

      // Write all three auth cookies (Secure, SameSite=Strict)
      setAuthCookies(accessToken, refreshToken, user);

      dispatch(loginSuccess(user));

      return data;
    } catch (error: any) {
      const message =
        error.response?.data?.message || 'Login failed. Please try again.';
      dispatch(loginFailure(message));
      throw error;
    }
  };

// ─── Register ─────────────────────────────────────────────────────────────────
export const Client_Register =
  (userData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) =>
  async (dispatch: AppDispatch) => {
    try {
      dispatch(registerStart());

      const { data } = await axios.post(`${API_BASE_URL}/auth/register`, userData);

      dispatch(registerSuccess());

      return data;
    } catch (error: any) {
      const message =
        error.response?.data?.message || 'Registration failed. Please try again.';
      dispatch(registerFailure(message));
      throw error;
    }
  };

// ─── Logout ───────────────────────────────────────────────────────────────────
export const Client_Logout = () => async (dispatch: AppDispatch) => {
  try {
    const refreshToken = getCookie(COOKIE.REFRESH);

    // Best-effort server-side token invalidation — never block UI on failure
    if (refreshToken) {
      await axios
        .post(`${API_BASE_URL}/auth/logout`, { refreshToken })
        .catch(() => {});
    }
  } finally {
    clearAuthCookies();
    dispatch(logoutSuccess());
  }
};
