import * as ownerService from './theatreOwner.service.js';
import { sendSuccess, sendCreated } from '../../utils/ApiResponse.js';

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const getMeta = (req) => ({
    ip: req.headers['x-forwarded-for']?.split(',')[0].trim() ?? req.socket.remoteAddress,
    userAgent: req.headers['user-agent'] ?? 'unknown',
});

export const register = asyncHandler(async (req, res) => {
    const { email, password, isMultiplex, theatreInfo, location, amenities, cancellationPolicy } = req.body;
    const data = await ownerService.register(
        { email, password, isMultiplex, theatreInfo, location, amenities, cancellationPolicy },
        getMeta(req)
    );
    sendCreated(res, data, 'Registration submitted. Awaiting admin approval.');
});

export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const data = await ownerService.login({ email, password }, getMeta(req));
    sendSuccess(res, data, 'Login successful');
});

export const refreshToken = asyncHandler(async (req, res) => {
    const data = await ownerService.refreshTokens(req.body.refreshToken, getMeta(req));
    sendSuccess(res, data, 'Tokens refreshed');
});

export const logout = asyncHandler(async (req, res) => {
    await ownerService.logout(req.body.refreshToken);
    sendSuccess(res, null, 'Logged out');
});

export const logoutAll = asyncHandler(async (req, res) => {
    await ownerService.logoutAll(req.user.id);
    sendSuccess(res, null, 'All sessions terminated');
});

export const getProfile = asyncHandler(async (req, res) => {
    const owner = await ownerService.getProfile(req.user.id);
    sendSuccess(res, { owner });
});

export const updateProfile = asyncHandler(async (req, res) => {
    const owner = await ownerService.updateProfile(req.user.id, req.body);
    sendSuccess(res, { owner }, 'Profile updated');
});

export const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    await ownerService.changePassword(req.user.id, currentPassword, newPassword);
    sendSuccess(res, null, 'Password changed successfully');
});