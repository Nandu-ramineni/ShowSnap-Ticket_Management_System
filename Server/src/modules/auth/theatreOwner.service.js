import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import ms from 'ms';
import TheatreOwner, { SUPPORTED_DOC_TYPES } from './theatreOwner.model.js';
import RefreshToken from './refreshToken.model.js';
import { uploadBuffer, deleteResource } from '../../config/cloudinary.js';
import ApiError from '../../utils/ApiError.js';
import env from '../../config/env.js';
import { ACCOUNT_STATUS, ONBOARDING_STATUS } from '../../utils/constants.js';

const SALT_ROUNDS = 12;
const TOKEN_OPTIONS = { issuer: env.jwt.issuer, audience: env.jwt.audience };

// ─── Cloudinary folders ───────────────────────────────────────────────────────
const CLOUDINARY_DOCS_FOLDER = 'seatsecure/theatre_owner_docs';

// ─── Token helpers ────────────────────────────────────────────────────────────

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
        userId: ownerId,
        tokenHash: hashToken(raw),
        userAgent,
        ip,
        expiresAt: new Date(Date.now() + ms(env.jwt.refreshExpiresIn)),
        family: raw.slice(0, 8),
    });
    return raw;
};

// ─── Document upload helper ───────────────────────────────────────────────────
// Uploads a single multer file to Cloudinary under the docs folder.
// Returns the shape expected by supportingDocumentSchema.

const uploadDocToCloudinary = async (file, docType) => {
    const result = await uploadBuffer(file.buffer, {
        folder: CLOUDINARY_DOCS_FOLDER,
        resource_type: 'auto',          // accept PDF + images
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
        // Store original filename as context metadata
        context: `docType=${docType}|originalName=${file.originalname}`,
        // Prevent public hotlinking of sensitive documents
        access_mode: 'authenticated',
    });

    return {
        docType,
        url: result.secure_url,
        publicId: result.public_id,
        fileName: file.originalname,
        fileSize: file.size,
    };
};

// ─── Step 1 — Register ────────────────────────────────────────────────────────
// Only email, password, name and supporting documents are required.
// All theatre/onboarding fields are filled later via /onboarding.
// No JWT tokens issued — account is pending until admin approves.

export const register = async ({ email, password, name,theatreName,isMultiplex = false, files = [] }) => {
    const existing = await TheatreOwner.findOne({ email });
    if (existing) throw ApiError.conflict('Email already registered');

    if (!files.length) throw ApiError.badRequest('At least one supporting document is required');

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);

    // Upload all documents in parallel
    const uploadedDocs = await Promise.all(
        files.map((f) => uploadDocToCloudinary(f, f.docType))
    );

    const owner = await TheatreOwner.create({
        email,
        password: hashed,
        name,
        isMultiplex,
        theatreInfo: { theatreName },
        supportingDocuments: uploadedDocs,
        accountStatus: ACCOUNT_STATUS.PENDING,
        onboardingStatus: ONBOARDING_STATUS.PENDING_ONBOARDING,
    });

    return { owner: owner.toPublicJSON() };
};

// ─── Step 2 — Login ───────────────────────────────────────────────────────────

export const login = async ({ email, password }, meta = {}) => {
    const owner = await TheatreOwner.findOne({ email }).select('+password');

    // Timing-safe: always run bcrypt regardless of whether owner was found
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

// ─── Refresh tokens ───────────────────────────────────────────────────────────

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

// ─── Get profile ──────────────────────────────────────────────────────────────

export const getProfile = async (ownerId) => {
    const owner = await TheatreOwner.findById(ownerId);
    if (!owner) throw ApiError.notFound('Theatre owner not found');
    return owner.toPublicJSON();
};

// ─── Step 3 — Onboarding ─────────────────────────────────────────────────────
// Called via PATCH /theatre-owner/onboarding (authenticated, approved owners only).
// Accepts all theatre profile fields. Partial saves are allowed — each save
// advances onboardingStatus to 'in_progress'. When all required fields are
// present, status automatically moves to 'completed'.
//
// Allowed onboarding fields:
//   name (update), isMultiplex, theatreInfo.*, location.*, amenities.*, cancellationPolicy.*

const ONBOARDING_TOP_FIELDS = ['name', 'isMultiplex'];

const ONBOARDING_NESTED_FIELDS = {
    theatreInfo: [
        'theatreName',    // required for completion
        'website',
        'contactPhone',   // required for completion
        'contactEmail',   // required for completion
    ],
    location: [
        'streetAddress',  // required for completion
        'city',           // required for completion
        'state',          // required for completion
        'pincode',        // required for completion
    ],
    amenities: [
        'parking', 'foodCourt', 'wheelchairAccess', 'mTicket',
        'threeD', 'dolbySound', 'fourDX', 'reclinerSeats',
        'atm', 'playing', 'lounge',
    ],
    cancellationPolicy: ['allowCancellations', 'cutoffHours', 'refundPercentage'],
};

export const saveOnboarding = async (ownerId, updates) => {
    const owner = await TheatreOwner.findById(ownerId);
    if (!owner) throw ApiError.notFound('Theatre owner not found');

    if (owner.onboardingStatus === ONBOARDING_STATUS.COMPLETED)
        throw ApiError.conflict('Onboarding is already completed. Use PATCH /profile to update details.');

    const $set = {};

    for (const field of ONBOARDING_TOP_FIELDS) {
        if (updates[field] !== undefined) $set[field] = updates[field];
    }

    for (const [group, allowedFields] of Object.entries(ONBOARDING_NESTED_FIELDS)) {
        if (updates[group] && typeof updates[group] === 'object') {
            for (const f of allowedFields) {
                if (updates[group][f] !== undefined) $set[`${group}.${f}`] = updates[group][f];
            }
        }
    }

    if (Object.keys($set).length === 0) throw ApiError.badRequest('No valid onboarding fields provided');

    // Advance to in_progress on first save
    if (owner.onboardingStatus === ONBOARDING_STATUS.PENDING_ONBOARDING) {
        $set.onboardingStatus = ONBOARDING_STATUS.IN_PROGRESS;
    }

    const updated = await TheatreOwner.findByIdAndUpdate(
        ownerId,
        { $set },
        { new: true, runValidators: true }
    );

    // Check if all required fields are now filled and auto-complete if so
    if (updated.isOnboardingComplete() &&
        updated.onboardingStatus !== ONBOARDING_STATUS.COMPLETED) {
        updated.onboardingStatus = ONBOARDING_STATUS.COMPLETED;
        await updated.save();
    }

    return {
        owner: updated.toPublicJSON(),
        onboardingComplete: updated.onboardingStatus === ONBOARDING_STATUS.COMPLETED,
    };
};

// ─── Update profile ───────────────────────────────────────────────────────────
// Available after onboarding is completed. Same fields as onboarding but
// onboardingStatus is never touched here.

const PROFILE_TOP_FIELDS = ['name', 'isMultiplex'];

const PROFILE_NESTED_FIELDS = {
    theatreInfo: [
        // theatreName intentionally excluded — contact support to rename
        'website', 'contactPhone', 'contactEmail',
    ],
    location: ['streetAddress', 'city', 'state', 'pincode'],
    amenities: ['parking', 'foodCourt', 'wheelchairAccess', 'mTicket', 'threeD', 'dolbySound', 'fourDX', 'reclinerSeats', 'atm', 'playing', 'lounge'],
    cancellationPolicy: ['allowCancellations', 'cutoffHours', 'refundPercentage'],
};

export const updateProfile = async (ownerId, updates) => {
    const $set = {};

    for (const field of PROFILE_TOP_FIELDS) {
        if (updates[field] !== undefined) $set[field] = updates[field];
    }

    for (const [group, allowedFields] of Object.entries(PROFILE_NESTED_FIELDS)) {
        if (updates[group] && typeof updates[group] === 'object') {
            for (const f of allowedFields) {
                if (updates[group][f] !== undefined) $set[`${group}.${f}`] = updates[group][f];
            }
        }
    }

    if (Object.keys($set).length === 0) throw ApiError.badRequest('No valid fields provided');

    const owner = await TheatreOwner.findByIdAndUpdate(
        ownerId,
        { $set },
        { new: true, runValidators: true }
    );
    if (!owner) throw ApiError.notFound('Theatre owner not found');
    return owner.toPublicJSON();
};

// ─── Upload additional supporting document ────────────────────────────────────
// Allows owner to add more documents after registration (e.g. NOC after approval).

export const addSupportingDocument = async (ownerId, file, docType) => {
    if (!SUPPORTED_DOC_TYPES.includes(docType)) {
        throw ApiError.badRequest(`Invalid docType. Allowed: ${SUPPORTED_DOC_TYPES.join(', ')}`);
    }

    const uploaded = await uploadDocToCloudinary(file, docType);

    const owner = await TheatreOwner.findByIdAndUpdate(
        ownerId,
        { $push: { supportingDocuments: uploaded } },
        { new: true }
    );
    if (!owner) throw ApiError.notFound('Theatre owner not found');
    return owner.toPublicJSON();
};

// ─── Delete supporting document ───────────────────────────────────────────────

export const deleteSupportingDocument = async (ownerId, docId) => {
    // Fetch with publicId selected (it's normally hidden)
    const owner = await TheatreOwner.findById(ownerId)
        .select('+supportingDocuments.publicId');

    if (!owner) throw ApiError.notFound('Theatre owner not found');

    const doc = owner.supportingDocuments.id(docId);
    if (!doc) throw ApiError.notFound('Document not found');

    if (owner.supportingDocuments.length === 1)
        throw ApiError.badRequest('Cannot delete the last supporting document. At least one is required.');

    // Delete from Cloudinary first — if this fails we haven't mutated the DB
    await deleteResource(doc.publicId);

    owner.supportingDocuments.pull(docId);
    await owner.save();

    return owner.toPublicJSON();
};

// ─── Change password ──────────────────────────────────────────────────────────

export const changePassword = async (ownerId, currentPassword, newPassword) => {
    const owner = await TheatreOwner.findById(ownerId).select('+password');
    if (!owner) throw ApiError.notFound('Theatre owner not found');

    if (!(await bcrypt.compare(currentPassword, owner.password)))
        throw ApiError.badRequest('Current password is incorrect');

    if (currentPassword === newPassword)
        throw ApiError.badRequest('New password must differ from current password');

    owner.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await owner.save();

    // Revoke all sessions — force re-login everywhere
    await RefreshToken.deleteMany({ userId: ownerId });
};