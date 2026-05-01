import * as authService from './auth.service.js';
import { sendSuccess, sendCreated } from '../../utils/ApiResponse.js';

// ─── asyncHandler ─────────────────────────────────────────────────────────────
// FIX: Your original controller had a try/catch block copy-pasted into every
// single function. That's ~30 lines of noise that hides the actual logic and
// breaks DRY. One wrapper eliminates all of it.
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ─── Meta helper ──────────────────────────────────────────────────────────────
// Extracts request context for refresh token DB records (IP, device tracking).
// x-forwarded-for is set by proxies/load balancers; fall back to socket address.
const getMeta = (req) => ({
  ip:        req.headers['x-forwarded-for']?.split(',')[0].trim() ?? req.socket.remoteAddress,
  userAgent: req.headers['user-agent'] ?? 'unknown',
});

// ─── Controllers ──────────────────────────────────────────────────────────────

export const register = asyncHandler(async (req, res) => {
  // FIX: Your original code passed the entire req.body to the service which
  // included `role`. The controller should be explicit about what it forwards.
  const { name, email, phone, password } = req.body;
  const data = await authService.register({ name, email, phone, password }, getMeta(req));
  sendCreated(res, data, 'Registration successful');
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const data = await authService.login({ email, password }, getMeta(req));
  sendSuccess(res, data, 'Login successful');
});

export const refreshToken = asyncHandler(async (req, res) => {
  // FIX: Original code had no meta passed to service at all — we need it
  // to record the new refresh token's IP and userAgent in the DB.
  const data = await authService.refreshTokens(req.body.refreshToken, getMeta(req));
  sendSuccess(res, data, 'Tokens refreshed');
});

// FIX: logout and logoutAll were completely missing.
// Without these, there's no way to invalidate a session or respond to a breach.
export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  sendSuccess(res, null, 'Logged out');
});

export const logoutAll = asyncHandler(async (req, res) => {
  await authService.logoutAll(req.user.id);
  sendSuccess(res, null, 'All sessions terminated');
});

export const getProfile = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user.id);
  sendSuccess(res, { user });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await authService.updateProfile(req.user.id, req.body);
  sendSuccess(res, { user }, 'Profile updated');
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user.id, currentPassword, newPassword);
  sendSuccess(res, null, 'Password changed successfully');
});