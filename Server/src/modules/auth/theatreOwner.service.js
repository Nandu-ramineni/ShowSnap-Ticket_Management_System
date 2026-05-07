import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import ms from 'ms';
import TheatreOwner from './theatreOwner.model.js';
import RefreshToken from './refreshToken.model.js';
import ApiError from '../../utils/ApiError.js';
import env from '../../config/env.js';
import { ACCOUNT_STATUS } from '../../utils/constants.js';

const SALT_ROUNDS = 12;
const TOKEN_OPTIONS = { issuer: env.jwt.issuer, audience: env.jwt.audience };

// ─── Token helpers ─────────────────────────────────────────────────────────────

const signAccessToken = (owner) =>
    jwt.sign(
        { sub: owner._id.toString(), email: owner.email, role: 'theatre_owner' },
        env.jwt.secret,
        { ...TOKEN_OPTIONS, expiresIn: env.jwt.expiresIn }
    );

const hashToken = (raw) =>
    crypto.createHash('sha256').update(raw).digest('hex');

const issueRefreshToken = async (ownerId, userAgent, ip) => {
    const raw = crypto.randomBytes(40).toString('hex');
    await RefreshToken.create({
        userId: ownerId,   // reuses the same RefreshToken collection; userId is generic ObjectId
        tokenHash: hashToken(raw),
        userAgent,
        ip,
        expiresAt: new Date(Date.now() + ms(env.jwt.refreshExpiresIn)),
        family: raw.slice(0, 8),
    });
    return raw;
};

// ─── Register ─────────────────────────────────────────────────────────────────
// Theatre owners always start with accountStatus: pending.
// No tokens are issued until admin approves.

export const register = async (
    { email, password, isMultiplex, theatreInfo, location, amenities, cancellationPolicy },
    meta = {}
) => {
    const existing = await TheatreOwner.findOne({ email });
    if (existing) throw ApiError.conflict('Email already registered');

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);

    const owner = await TheatreOwner.create({
        email,
        password: hashed,
        isMultiplex: isMultiplex ?? false,
        theatreInfo,
        location,
        amenities: amenities ?? {},
        cancellationPolicy: cancellationPolicy ?? {},
        accountStatus: ACCOUNT_STATUS.PENDING,
    });

    // No tokens for pending owners — they cannot log in until approved.
    return { owner: owner.toPublicJSON() };
};

// ─── Login ────────────────────────────────────────────────────────────────────

export const login = async ({ email, password }, meta = {}) => {
    const owner = await TheatreOwner.findOne({ email }).select('+password');

    const DUMMY_HASH = '$2b$12$invalidhashfortimingprotectiononly000000000000000000000';
    const passwordMatch = owner
        ? await bcrypt.compare(password, owner.password)
        : (await bcrypt.compare(password, DUMMY_HASH), false);

    if (!owner || !passwordMatch) throw ApiError.unauthorized('Invalid credentials');

    if (owner.accountStatus === ACCOUNT_STATUS.PENDING)
        throw ApiError.forbidden('Your account is under review. You will be notified once approved.');

    if (owner.accountStatus === ACCOUNT_STATUS.REJECTED)
        throw ApiError.forbidden('Your account application was rejected. Please contact support.');

    if (!owner.isActive)
        throw ApiError.forbidden('Account has been suspended. Please contact support.');

    return {
        owner: owner.toPublicJSON(),
        accessToken: signAccessToken(owner),
        refreshToken: await issueRefreshToken(owner._id, meta.userAgent, meta.ip),
    };
};

// ─── Refresh tokens ────────────────────────────────────────────────────────────

export const refreshTokens = async (rawToken, meta = {}) => {
    if (!rawToken) throw ApiError.unauthorized('Refresh token required');

    const tokenHash = hashToken(rawToken);
    const stored = await RefreshToken.findOne({ tokenHash });

    if (!stored) throw ApiError.unauthorized('Invalid refresh token');

    if (stored.usedAt) {
        await RefreshToken.deleteMany({ family: stored.family });
        throw ApiError.unauthorized('Refresh token reuse detected — all sessions invalidated');
    }

    if (stored.expiresAt < new Date()) {
        await stored.deleteOne();
        throw ApiError.unauthorized('Refresh token expired');
    }

    // Resolve owner manually (userId is a generic ref in RefreshToken)
    const owner = await TheatreOwner.findById(stored.userId);
    if (!owner || !owner.isActive || owner.accountStatus !== ACCOUNT_STATUS.ACTIVE) {
        await stored.deleteOne();
        throw ApiError.unauthorized('Account not accessible');
    }

    stored.usedAt = new Date();
    await stored.save();

    return {
        accessToken: signAccessToken(owner),
        refreshToken: await issueRefreshToken(owner._id, meta.userAgent, meta.ip),
    };
};

// ─── Logout ───────────────────────────────────────────────────────────────────

export const logout = async (rawToken) => {
    if (!rawToken) return;
    await RefreshToken.deleteOne({ tokenHash: hashToken(rawToken) });
};

export const logoutAll = async (ownerId) => {
    await RefreshToken.deleteMany({ userId: ownerId });
};

// ─── Profile ───────────────────────────────────────────────────────────────────

export const getProfile = async (ownerId) => {
    const owner = await TheatreOwner.findById(ownerId);
    if (!owner) throw ApiError.notFound('Theatre owner not found');
    return owner.toPublicJSON();
};

// Allowed top-level and nested fields for self-service updates
const ALLOWED_TOP = ['isMultiplex'];
const ALLOWED_NESTED = {
    theatreInfo: ['website', 'contactPhone', 'contactEmail'],  // theatreName is set on register
    location: ['streetAddress', 'city', 'state', 'pincode'],
    amenities: ['parking', 'foodCourt', 'wheelchairAccess', 'mTicket', 'threeD', 'dolbySound', 'fourDX', 'reclinerSeats', 'atm', 'playing', 'lounge'],
    cancellationPolicy: ['allowCancellations', 'cutoffHours', 'refundPercentage'],
};

export const updateProfile = async (ownerId, updates) => {
    const $set = {};

    for (const field of ALLOWED_TOP) {
        if (updates[field] !== undefined) $set[field] = updates[field];
    }

    for (const [group, allowedFields] of Object.entries(ALLOWED_NESTED)) {
        if (updates[group] && typeof updates[group] === 'object') {
            for (const f of allowedFields) {
                if (updates[group][f] !== undefined) $set[`${group}.${f}`] = updates[group][f];
            }
        }
    }

    if (Object.keys($set).length === 0) throw ApiError.badRequest('No valid fields provided');

    const owner = await TheatreOwner.findByIdAndUpdate(ownerId, { $set }, { new: true, runValidators: true });
    if (!owner) throw ApiError.notFound('Theatre owner not found');
    return owner.toPublicJSON();
};

export const changePassword = async (ownerId, currentPassword, newPassword) => {
    const owner = await TheatreOwner.findById(ownerId).select('+password');
    if (!owner) throw ApiError.notFound('Theatre owner not found');

    if (!(await bcrypt.compare(currentPassword, owner.password)))
        throw ApiError.badRequest('Current password is incorrect');

    if (currentPassword === newPassword)
        throw ApiError.badRequest('New password must differ from current password');

    owner.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await owner.save();

    // Revoke all sessions on password change
    await RefreshToken.deleteMany({ userId: ownerId });
};