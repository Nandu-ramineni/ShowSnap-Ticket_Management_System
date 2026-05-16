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
import { generateApplicationId } from '../../utils/generateApplicationId.js';
import { sendOTPEmail, sendPasswordResetEmail } from '../../utils/nodeMailer.js';
import logger from '../../utils/logger.js';

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

export const register = async ({ email, password, name, theatreName,isMultiplex = false, files = [] }) => {
    const existing = await TheatreOwner.findOne({ email });
    if (existing) throw ApiError.conflict('Email already registered');

    if (!files.length) throw ApiError.badRequest('At least one supporting document is required');

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);

    // Upload all documents in parallel
    const uploadedDocs = await Promise.all(
        files.map((f) => uploadDocToCloudinary(f, f.docType))
    );

    const applicationId = await generateApplicationId();

    const owner = await TheatreOwner.create({
        email,
        password: hashed,
        name,
        applicationId,
        isMultiplex,
        theatreInfo: { theatreName: theatreName },
        supportingDocuments: uploadedDocs,
        accountStatus: ACCOUNT_STATUS.PENDING,
        onboardingStatus: ONBOARDING_STATUS.PENDING_ONBOARDING,
    });
 
    return { owner: owner.toPublicJSON() };
};

// ─── Step 2 — Login ───────────────────────────────────────────────────────────

export const login = async ({ email, password }, meta = {}) => {
    const owner = await TheatreOwner.findOne({ email })
        .select('+password +rejectionReason');

    // Timing-safe
    const DUMMY_HASH =
        '$2b$12$invalidhashfortimingprotectiononly000000000000000000000';

    const passwordMatch = owner
        ? await bcrypt.compare(password, owner.password)
        : (await bcrypt.compare(password, DUMMY_HASH), false);

    if (!owner || !passwordMatch) {
        throw ApiError.unauthorized('Invalid credentials');
    }

    // Pending account
    if (owner.accountStatus === ACCOUNT_STATUS.PENDING) {
        return {
            pending: true,
            owner: owner.toPublicJSON(),
        };
    }

    // Rejected account
    if (owner.accountStatus === ACCOUNT_STATUS.REJECTED) {
        return {
            rejected: true,
            owner: owner.toPublicJSON(),
        };
    }

    // Suspended account
    if (!owner.isActive) {
        throw ApiError.forbidden(
            'Account has been suspended. Please contact support.'
        );
    }

    // Successful login
    return {
        owner: owner.toPublicJSON(),
        accessToken: signAccessToken(owner),
        refreshToken: await issueRefreshToken(
            owner._id,
            meta.userAgent,
            meta.ip
        ),
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

// ─── Password Reset: Step 1 - Request OTP ───────────────────────────────────────

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const requestPasswordReset = async (email) => {
    const owner = await TheatreOwner.findOne({ email });
    if (!owner) throw ApiError.notFound('Theatre owner not found with this email');

    // Generate 6-digit OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to database
    owner.resetPassword = owner.resetPassword || {};
    owner.resetPassword.passwordResetOTP = otp;
    owner.resetPassword.passwordResetOTPExpires = otpExpiry;
    await owner.save();

    // Send OTP via email
    try {
        await sendOTPEmail(owner.email, owner.name, otp);
        logger.info(`OTP sent to ${owner.email}`);
    } catch (error) {
        logger.error(`Failed to send OTP email: ${error.message}`);
        throw ApiError.internal('Failed to send OTP. Please try again later.');
    }

    return {
        message: 'OTP sent to your registered email',
        email: owner.email,
    };
};

// ─── Password Reset: Step 2 - Verify OTP & Generate Token ────────────────────────

export const verifyOTPAndGenerateToken = async (email, otp) => {
    const owner = await TheatreOwner.findOne({ email })
        .select('+resetPassword.passwordResetOTP +resetPassword.passwordResetOTPExpires');

    if (!owner) throw ApiError.notFound('Theatre owner not found');

    const storedOTP = owner.resetPassword?.passwordResetOTP;
    const otpExpiry = owner.resetPassword?.passwordResetOTPExpires;

    // Verify OTP exists and not expired
    if (!storedOTP || !otpExpiry) {
        throw ApiError.badRequest('No OTP request found. Please request a new OTP.');
    }

    if (new Date() > otpExpiry) {
        throw ApiError.badRequest('OTP has expired. Please request a new one.');
    }

    if (otp !== storedOTP) {
        throw ApiError.unauthorized('Invalid OTP. Please try again.');
    }

    // Generate password reset token (valid for 15 minutes)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const tokenExpiry = new Date(Date.now() + 15 * 60 * 1000);

    // Save token and clear OTP
    owner.resetPassword.passwordResetToken = tokenHash;
    owner.resetPassword.passwordResetTokenExpires = tokenExpiry;
    owner.resetPassword.passwordResetOTP = undefined;
    owner.resetPassword.passwordResetOTPExpires = undefined;
    await owner.save();

    // Send password reset email with token
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${email}`;
    try {
        await sendPasswordResetEmail(owner.email, owner.name, resetLink);
        logger.info(`Password reset email sent to ${owner.email}`);
    } catch (error) {
        logger.error(`Failed to send reset email: ${error.message}`);
        throw ApiError.internal('Failed to send reset email. Please try again later.');
    }

    return {
        message: 'OTP verified. Password reset email sent to your email.',
        email: owner.email,
    };
};

// ─── Password Reset: Step 3 - Reset Password ──────────────────────────────────

export const resetPassword = async (email, resetToken, newPassword) => {
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    const owner = await TheatreOwner.findOne({ email })
        .select('+resetPassword.passwordResetToken +resetPassword.passwordResetTokenExpires +password');

    if (!owner) throw ApiError.notFound('Theatre owner not found');

    const storedTokenHash = owner.resetPassword?.passwordResetToken;
    const tokenExpiry = owner.resetPassword?.passwordResetTokenExpires;

    // Verify token exists and not expired
    if (!storedTokenHash || !tokenExpiry) {
        throw ApiError.badRequest('Password reset token not found or expired.');
    }

    if (new Date() > tokenExpiry) {
        throw ApiError.badRequest('Password reset token has expired. Please request a new one.');
    }

    // Verify token hash matches
    if (tokenHash !== storedTokenHash) {
        throw ApiError.unauthorized('Invalid reset token.');
    }

    // Hash new password and update
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    owner.password = hashedPassword;
    owner.resetPassword.passwordResetToken = undefined;
    owner.resetPassword.passwordResetTokenExpires = undefined;
    await owner.save();

    // Revoke all sessions — force re-login
    await RefreshToken.deleteMany({ userId: owner._id });

    logger.info(`Password reset successful for ${owner.email}`);

    return {
        success: true,
        message: 'Password reset successful. Please login with your new password.',
    };
};