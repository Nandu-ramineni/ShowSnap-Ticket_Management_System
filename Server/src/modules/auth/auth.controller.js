import * as authService from './auth.service.js';
import { sendSuccess, sendCreated } from '../../utils/ApiResponse.js';

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const getMeta = (req) => ({
  ip:        req.headers['x-forwarded-for']?.split(',')[0].trim() ?? req.socket.remoteAddress,
  userAgent: req.headers['user-agent'] ?? 'unknown',
});

export const register = asyncHandler(async (req, res) => {
  // FIX: was `{ name, email, phone, password }` — role was stripped out entirely.
  // theatre_owner registrations silently became regular users because role
  // never reached authService.register() to trigger PENDING status.
  const { name, email, phone, password, role } = req.body;
  const data = await authService.register({ name, email, phone, password, role }, getMeta(req));
  sendCreated(res, data, 'Registration successful');
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const data = await authService.login({ email, password }, getMeta(req));
  sendSuccess(res, data, 'Login successful');
});

export const refreshToken = asyncHandler(async (req, res) => {
  const data = await authService.refreshTokens(req.body.refreshToken, getMeta(req));
  sendSuccess(res, data, 'Tokens refreshed');
});

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