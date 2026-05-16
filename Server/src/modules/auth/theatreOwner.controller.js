import * as ownerService from './theatreOwner.service.js';
import { sendSuccess, sendCreated } from '../../utils/ApiResponse.js';
import { SUPPORTED_DOC_TYPES } from './theatreOwner.model.js';

const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

const getMeta = (req) => ({
    ip: req.headers['x-forwarded-for']?.split(',')[0].trim() ?? req.socket.remoteAddress,
    userAgent: req.headers['user-agent'] ?? 'unknown',
});

// ─── Step 1: Registration ─────────────────────────────────────────────────────
// Accepts multipart/form-data with:
//   email, password, name  (text fields)
//   documents[]            (files, field name: "documents")
//   docTypes[]             (matching type per file, e.g. "gst_certificate")
//
// Multer attaches files to req.files. We zip them with the docType metadata
// from req.body.docTypes[] before passing to the service.

export const register = asyncHandler(async (req, res) => {
    const { email, password, name, theatreName , isMultiplex } = req.body;
    console.log('Received registration:', { email, name, theatreName, isMultiplex, files: req.files?.length ?? 0 });
    // req.files is an array from upload.array('documents', 10)
    // req.body.docTypes is a string (single upload) or array (multiple)
    const rawFiles = req.files ?? [];
    const rawTypes = req.body.docTypes
        ? (Array.isArray(req.body.docTypes) ? req.body.docTypes : [req.body.docTypes])
        : [];

    // Attach the declared docType onto each multer file object
    const files = rawFiles.map((f, i) => {
        f.docType = rawTypes[i] ?? 'other';
        return f;
    });

    const data = await ownerService.register({ email, password, name, theatreName, isMultiplex, files });
    sendCreated(res, data, 'Registration submitted. Awaiting admin approval.');
});

// ─── Step 2: Login ────────────────────────────────────────────────────────────
export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const data = await ownerService.login(
        { email, password },
        getMeta(req)
    );

    // ── Pending account ─────────────────────────────
    if (data?.pending) {
        return res.status(403).json({
            success: false,
            pending: true,
            message:
                'Your account is under review. You will be notified once approved.',
            owner: data.owner,
        });
    }

    // ── Rejected account ─────────────────────────────
    if (data?.rejected) {
        return res.status(403).json({
            success: false,
            rejected: true,
            message:
                'Your account has been rejected. Please contact support for more information.',
            owner: data.owner, // Include rejectionReason in the response
        });
    }

    // ── Normal successful login ─────────────────────
    sendSuccess(res, data, 'Login successful');
});

// ─── Token management ─────────────────────────────────────────────────────────

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

// ─── Profile ──────────────────────────────────────────────────────────────────

export const getProfile = asyncHandler(async (req, res) => {
    const owner = await ownerService.getProfile(req.user.id);
    sendSuccess(res, { owner });
});

// ─── Step 3: Onboarding ───────────────────────────────────────────────────────

export const saveOnboarding = asyncHandler(async (req, res) => {
    const result = await ownerService.saveOnboarding(req.user.id, req.body);
    const message = result.onboardingComplete
        ? 'Onboarding completed successfully'
        : 'Onboarding progress saved';
    sendSuccess(res, result, message);
});

// ─── Step 4: Profile update (post-onboarding) ─────────────────────────────────

export const updateProfile = asyncHandler(async (req, res) => {
    const owner = await ownerService.updateProfile(req.user.id, req.body);
    sendSuccess(res, { owner }, 'Profile updated');
});

// ─── Document management ──────────────────────────────────────────────────────

export const addDocument = asyncHandler(async (req, res) => {
    const file = req.file;
    const docType = req.body.docType ?? 'other';

    if (!file) throw Object.assign(new Error('Document file is required'), { statusCode: 400 });

    const owner = await ownerService.addSupportingDocument(req.user.id, file, docType);
    sendCreated(res, { owner }, 'Document uploaded successfully');
});

export const deleteDocument = asyncHandler(async (req, res) => {
    const owner = await ownerService.deleteSupportingDocument(req.user.id, req.params.docId);
    sendSuccess(res, { owner }, 'Document deleted successfully');
});

// ─── Password ─────────────────────────────────────────────────────────────────

export const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    await ownerService.changePassword(req.user.id, currentPassword, newPassword);
    sendSuccess(res, null, 'Password changed successfully');
});

// ─── Password Reset Flow ──────────────────────────────────────────────────────

export const requestPasswordReset = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const result = await ownerService.requestPasswordReset(email);
    sendSuccess(res, result, 'OTP sent to your email');
});

export const verifyOTPAndGenerateToken = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
    const result = await ownerService.verifyOTPAndGenerateToken(email, otp);
    sendSuccess(res, result, 'OTP verified. Check your email for reset link.');
});

export const resetPassword = asyncHandler(async (req, res) => {
    const { email, resetToken, newPassword } = req.body;
    const result = await ownerService.resetPassword(email, resetToken, newPassword);
    sendSuccess(res, result, 'Password reset successful');
});

