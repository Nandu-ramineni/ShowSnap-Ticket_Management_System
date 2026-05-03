import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { getUserFromCookie } from '@/lib/cookies';
import type { UserData } from '@/lib/types/auth';

export interface AuthState {
  isAuthenticated: boolean;
  user: UserData | null;
  loading: boolean;
  error: string | null;
}

/**
 * On app boot, rehydrate from the ss_user cookie.
 * Tokens (ss_access / ss_refresh) are read directly by the api-client
 * interceptor — Redux never stores raw tokens.
 */
function loadInitialState(): AuthState {
  const base: AuthState = {
    isAuthenticated: false,
    user: null,
    loading: false,
    error: null,
  };

  if (typeof document === 'undefined') return base; // SSR guard

  const user = getUserFromCookie<UserData>();
  if (user?.id) {
    return { ...base, isAuthenticated: true, user };
  }

  return base;
}

const authSlice = createSlice({
  name: 'auth',
  initialState: loadInitialState,
  reducers: {
    loginStart(state) {
      state.loading = true;
      state.error = null;
    },
    loginSuccess(state, action: PayloadAction<UserData>) {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload;
      state.error = null;
    },
    loginFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.error = action.payload;
    },
    logoutSuccess(state) {
      state.isAuthenticated = false;
      state.user = null;
      state.loading = false;
      state.error = null;
      // Cookies are cleared in the action before this is dispatched
    },
    registerStart(state) {
      state.loading = true;
      state.error = null;
    },
    registerSuccess(state) {
      state.loading = false;
      state.error = null;
    },
    registerFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
    updateUser(state, action: PayloadAction<Partial<UserData>>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logoutSuccess,
  registerStart,
  registerSuccess,
  registerFailure,
  clearError,
  updateUser,
} = authSlice.actions;

export default authSlice.reducer;
