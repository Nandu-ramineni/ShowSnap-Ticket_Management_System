import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import ms from 'ms'; // FIX: was missing — ms() on line 33 caused ReferenceError at runtime
import User from './user.model.js';
import RefreshToken from './refreshToken.model.js';
import ApiError from '../../utils/ApiError.js';
import env from '../../config/env.js';
import { ROLES, ACCOUNT_STATUS, REGISTERABLE_ROLES } from '../../utils/constants.js';

const SALT_ROUNDS = 12;
const ALLOWED_PROFILE_FIELDS = ['name', 'phone', 'preferredCity', 'avatar'];
const TOKEN_OPTIONS = { issuer: env.jwt.issuer, audience: env.jwt.audience };

// ─── Token helpers ────────────────────────────────────────────────────────────

const signAccessToken = (user) =>
  jwt.sign(
    { sub: user._id.toString(), email: user.email, role: user.role },
    env.jwt.secret,
    { ...TOKEN_OPTIONS, expiresIn: env.jwt.expiresIn }
  );

const hashToken = (raw) =>
  crypto.createHash('sha256').update(raw).digest('hex');

const issueRefreshToken = async (userId, userAgent, ip) => {
  const raw = crypto.randomBytes(40).toString('hex');
  await RefreshToken.create({
    userId,
    tokenHash: hashToken(raw),
    userAgent,
    ip,
    expiresAt: new Date(Date.now() + ms(env.jwt.refreshExpiresIn)), // ms() now resolvable
    family:    raw.slice(0, 8),
  });
  return raw;
};

// ─── Register ─────────────────────────────────────────────────────────────────

export const register = async ({ name, email, phone, password, role }, meta = {}) => {
  const assignedRole =
    role && REGISTERABLE_ROLES.includes(role) ? role : ROLES.USER;

  const accountStatus =
    assignedRole === ROLES.THEATRE_OWNER
      ? ACCOUNT_STATUS.PENDING
      : ACCOUNT_STATUS.ACTIVE;

  if (await User.exists({ email })) {
    throw ApiError.conflict('Email already registered');
  }

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({
    name, email, phone, password: hashed,
    role: assignedRole,
    accountStatus,
  });

  if (accountStatus === ACCOUNT_STATUS.PENDING) {
    return { user: user.toPublicJSON() };
  }

  return {
    user:         user.toPublicJSON(),
    accessToken:  signAccessToken(user),
    refreshToken: await issueRefreshToken(user._id, meta.userAgent, meta.ip),
  };
};

// ─── Login ────────────────────────────────────────────────────────────────────

export const login = async ({ email, password }, meta = {}) => {
  const user = await User.findOne({ email }).select('+password');

  const DUMMY_HASH = '$2b$12$invalidhashfortimingprotectiononly000000000000000000000';
  const passwordMatch = user
    ? await bcrypt.compare(password, user.password)
    : (await bcrypt.compare(password, DUMMY_HASH), false);

  if (!user || !passwordMatch) {
    throw ApiError.unauthorized('Invalid credentials');
  }

  if (user.accountStatus === ACCOUNT_STATUS.PENDING) {
    throw ApiError.forbidden('Your account is under review. You will be notified once approved.');
  }
  if (user.accountStatus === ACCOUNT_STATUS.REJECTED) {
    throw ApiError.forbidden('Your account application was rejected. Please contact support.');
  }
  if (!user.isActive) {
    throw ApiError.forbidden('Account has been suspended. Please contact support.');
  }

  return {
    user:         user.toPublicJSON(),
    accessToken:  signAccessToken(user),
    refreshToken: await issueRefreshToken(user._id, meta.userAgent, meta.ip),
  };
};

// ─── Refresh tokens ───────────────────────────────────────────────────────────

export const refreshTokens = async (rawToken, meta = {}) => {
  if (!rawToken) throw ApiError.unauthorized('Refresh token required');

  const tokenHash = hashToken(rawToken);
  const stored = await RefreshToken.findOne({ tokenHash }).populate('userId');

  if (!stored) throw ApiError.unauthorized('Invalid refresh token');

  if (stored.usedAt) {
    await RefreshToken.deleteMany({ family: stored.family });
    throw ApiError.unauthorized('Refresh token reuse detected — all sessions invalidated');
  }

  if (stored.expiresAt < new Date()) {
    await stored.deleteOne();
    throw ApiError.unauthorized('Refresh token expired');
  }

  const user = stored.userId;
  if (!user || !user.isActive || user.accountStatus !== ACCOUNT_STATUS.ACTIVE) {
    await stored.deleteOne();
    throw ApiError.unauthorized('Account not accessible');
  }

  stored.usedAt = new Date();
  await stored.save();

  return {
    accessToken:  signAccessToken(user),
    refreshToken: await issueRefreshToken(user._id, meta.userAgent, meta.ip),
  };
};

// ─── Logout ───────────────────────────────────────────────────────────────────

export const logout = async (rawToken) => {
  if (!rawToken) return;
  await RefreshToken.deleteOne({ tokenHash: hashToken(rawToken) });
};

export const logoutAll = async (userId) => {
  await RefreshToken.deleteMany({ userId });
};

// ─── Profile ──────────────────────────────────────────────────────────────────

export const getProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User not found');
  return user.toPublicJSON();
};

export const updateProfile = async (userId, updates) => {
  const filtered = Object.fromEntries(
    Object.entries(updates).filter(([k]) => ALLOWED_PROFILE_FIELDS.includes(k))
  );
  if (Object.keys(filtered).length === 0) {
    throw ApiError.badRequest('No valid fields provided');
  }
  const user = await User.findByIdAndUpdate(userId, filtered, { new: true, runValidators: true });
  if (!user) throw ApiError.notFound('User not found');
  return user.toPublicJSON();
};

export const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select('+password');
  if (!user) throw ApiError.notFound('User not found');

  if (!(await bcrypt.compare(currentPassword, user.password))) {
    throw ApiError.badRequest('Current password is incorrect');
  }
  if (currentPassword === newPassword) {
    throw ApiError.badRequest('New password must differ from current password');
  }

  user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await user.save();
  await RefreshToken.deleteMany({ userId });
};