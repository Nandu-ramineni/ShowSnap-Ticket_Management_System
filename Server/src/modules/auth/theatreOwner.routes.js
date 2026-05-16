import { Router } from 'express';
import { body, param } from 'express-validator';
import * as ownerController from './theatreOwner.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { authLimiter } from '../../middlewares/rateLimiter.middleware.js';
import { uploadDocuments, uploadDocument } from '../../middlewares/upload.middleware.js';
import { validate } from '../../utils/validate.js';
import { ROLES, ONBOARDING_STATUS } from '../../utils/constants.js';
import { SUPPORTED_DOC_TYPES } from './theatreOwner.model.js';

const router = Router();

// ─── Guards ────────────────────────────────────────────────────────────────────
// ownerGuard       — any approved, active theatre owner
// ownerGuard is [authenticate, authorize(ROLES.THEATRE_OWNER)] so it works
// for ALL token-protected owner routes regardless of onboardingStatus.
// The onboarding route itself is open to any approved owner including
// those who are still pending_onboarding.

const ownerGuard = [authenticate, authorize(ROLES.THEATRE_OWNER)];

// ─── Shared field validators ───────────────────────────────────────────────────

const PASSWORD_COMPLEXITY =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?])/;

const v = {
    email: body('email')
        .isEmail().withMessage('Valid email required')
        .normalizeEmail(),

    password: body('password')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(PASSWORD_COMPLEXITY)
        .withMessage('Password must contain uppercase, lowercase, number, and special character'),

    newPassword: body('newPassword')
        .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
        .matches(PASSWORD_COMPLEXITY)
        .withMessage('New password must contain uppercase, lowercase, number, and special character'),

    currentPassword: body('currentPassword')
        .notEmpty().withMessage('Current password is required'),

    refreshToken: body('refreshToken')
        .notEmpty().withMessage('Refresh token is required'),

    name: body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ max: 150 }).withMessage('Name must be 150 chars or fewer'),

    // docTypes[] — validated at registration (one per file)
    docTypes: body('docTypes')
        .optional()
        .custom((val) => {
            const types = Array.isArray(val) ? val : [val];
            const invalid = types.filter((t) => !SUPPORTED_DOC_TYPES.includes(t));
            if (invalid.length) {
                throw new Error(`Invalid docType(s): ${invalid.join(', ')}. Allowed: ${SUPPORTED_DOC_TYPES.join(', ')}`);
            }
            return true;
        }),

    // Onboarding / profile fields (all optional individually — completeness
    // is checked at service layer, not at the validator layer)
    onboarding: {
        theatreName: body('theatreInfo.theatreName')
            .optional().trim()
            .isLength({ max: 150 }).withMessage('Theatre name must be 150 chars or fewer'),
        website: body('theatreInfo.website')
            .optional({ nullable: true })
            .isURL().withMessage('Website must be a valid URL'),
        contactPhone: body('theatreInfo.contactPhone')
            .optional({ nullable: true })
            .isMobilePhone().withMessage('Contact phone must be a valid mobile number'),
        contactEmail: body('theatreInfo.contactEmail')
            .optional({ nullable: true })
            .isEmail().withMessage('Contact email must be a valid email'),
        streetAddress: body('location.streetAddress')
            .optional().trim()
            .isLength({ max: 200 }).withMessage('Street address must be 200 chars or fewer'),
        city: body('location.city').optional().trim().isLength({ max: 100 }).withMessage('City must be 100 chars or fewer'),
        state: body('location.state').optional().trim().isLength({ max: 100 }).withMessage('State must be 100 chars or fewer'),
        pincode: body('location.pincode')
            .optional()
            .matches(/^\d{4,10}$/).withMessage('Pincode must be 4–10 digits'),
    },

    //check if the owner is multiplex or not
    isMultiplex: body('isMultiplex').optional().isBoolean().withMessage('isMultiplex must be a boolean'),
};

// Amenity validators — shared between onboarding and profile update
const amenityFields = [
    'parking', 'foodCourt', 'wheelchairAccess', 'mTicket',
    'threeD', 'dolbySound', 'fourDX', 'reclinerSeats', 'atm', 'playing', 'lounge',
];
const amenityValidators = amenityFields.map((f) =>
    body(`amenities.${f}`).optional().isBoolean().withMessage(`amenities.${f} must be a boolean`)
);

// Cancellation policy validators — shared
const cancellationValidators = [
    body('cancellationPolicy.allowCancellations').optional().isBoolean().withMessage('allowCancellations must be a boolean'),
    body('cancellationPolicy.cutoffHours').optional().isFloat({ min: 0, max: 720 }).withMessage('cutoffHours must be between 0 and 720'),
    body('cancellationPolicy.refundPercentage').optional().isFloat({ min: 0, max: 100 }).withMessage('refundPercentage must be between 0 and 100'),
];

// ─── Routes ────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * tags:
 *   - name: TheatreOwner — Auth
 *     description: Registration and authentication for theatre owners
 *   - name: TheatreOwner — Onboarding
 *     description: Post-approval onboarding flow (fill theatre profile)
 *   - name: TheatreOwner — Profile
 *     description: Ongoing profile management after onboarding is complete
 *   - name: TheatreOwner — Documents
 *     description: Supporting document management
 */

// ════════════════════════════════════════════════════════════════════════════════
// STEP 1 — REGISTER
// ════════════════════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /theatre-owner/register:
 *   post:
 *     summary: Register a new theatre owner
 *     description: |
 *       **Step 1 of the theatre owner flow.**
 *
 *       Accepts `multipart/form-data`. Submit:
 *       - `email`, `password`, `name`, `theatreName`, `isMultiplex` as text fields
 *       - `documents` as one or more file fields (images or PDFs, max 10 MB each)
 *       - `docTypes` as matching text fields (one per document file)
 *
 *       Account is created with:
 *       - `accountStatus: pending` — admin must approve before login is possible
 *       - `onboardingStatus: pending_onboarding` — theatre profile filled post-approval
 *
 *       **No tokens are issued.** The owner is notified when approved.
 *
 *       Allowed `docType` values: `gst_certificate`, `business_registration`,
 *       `trade_license`, `pan_card`, `identity_proof`, `address_proof`, `noc`, `other`
 *     tags: [TheatreOwner — Auth]
 *     x-rateLimit: authLimiter
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [email, password, name, theatreName, documents, docTypes]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: priya@inoxcinemas.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: Owner@123
 *               name:
 *                 type: string
 *                 example: Priya Nair
 *               theatreName:
 *                 type: string
 *                 example: PVR Cinemas Kukatpally
 *               isMultiplex:
 *                 type: boolean
 *                 example: true
 *               documents:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: One or more document files (JPEG/PNG/WebP/PDF, max 10 MB each)
 *               docTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [gst_certificate, business_registration, trade_license, pan_card, identity_proof, address_proof, noc, other]
 *                 description: One docType per uploaded document file (same order)
 *                 example: [gst_certificate, trade_license]
 *           encoding:
 *             documents:
 *               contentType: image/jpeg, image/png, image/webp, application/pdf
 *     responses:
 *       201:
 *         description: Registration submitted — awaiting admin approval
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         owner:
 *                           $ref: '#/components/schemas/TheatreOwnerPublic'
 *             example:
 *               success: true
 *               message: Registration submitted. Awaiting admin approval.
 *               data:
 *                 owner:
 *                   id: 64f1a2b3c4d5e6f7a8b9c0d1
 *                   email: priya@inoxcinemas.com
 *                   name: Priya Nair
 *                   accountStatus: pending
 *                   onboardingStatus: pending_onboarding
 *                   supportingDocuments:
 *                     - id: 64f1a2b3c4d5e6f7a8b9c0d2
 *                       docType: gst_certificate
 *                       url: https://res.cloudinary.com/seatsecure/...
 *                       fileName: gst_cert.pdf
 *                       fileSize: 204800
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.post(
    '/register',
    authLimiter,
    uploadDocuments(10),    // multer: req.files[], max 10 docs, images + PDF
    [
        v.email,
        v.password,
        v.name,
        body(['theatreInfo.theatreName', 'theatreName'])
            .optional()
            .trim()
            .isLength({ max: 150 })
            .withMessage('Theatre name must be 150 chars or fewer'),
        v.isMultiplex,
        v.docTypes
    ],
    validate,
    ownerController.register,
);

// ════════════════════════════════════════════════════════════════════════════════
// STEP 2 — LOGIN
// ════════════════════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /theatre-owner/login:
 *   post:
 *     summary: Log in as a theatre owner
 *     description: |
 *       **Step 2 of the theatre owner flow** (after admin approval).
 *
 *       Returns a JWT access token + refresh token.
 *
 *       Blocked states (return 403):
 *       - `accountStatus: pending` — still under review
 *       - `accountStatus: rejected` — application was declined
 *       - `isActive: false` — account suspended by admin
 *
 *       After login, check `onboardingStatus` in the response:
 *       - `pending_onboarding` or `in_progress` → redirect to onboarding form
 *       - `completed` → owner has full access
 *     tags: [TheatreOwner — Auth]
 *     x-rateLimit: authLimiter
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: priya@inoxcinemas.com
 *               password:
 *                 type: string
 *                 example: Owner@123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/TheatreOwnerAuthTokens'
 *             example:
 *               success: true
 *               message: Login successful
 *               data:
 *                 owner:
 *                   id: 64f1a2b3c4d5e6f7a8b9c0d1
 *                   email: priya@inoxcinemas.com
 *                   name: Priya Nair
 *                   accountStatus: active
 *                   onboardingStatus: pending_onboarding
 *                 accessToken: eyJhbGciOiJIUzI1NiJ9...
 *                 refreshToken: a3f9c2e1b4d7...
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Invalid email or password
 *       403:
 *         description: Account not accessible
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               pending:
 *                 summary: Account under review
 *                 value:
 *                   success: false
 *                   message: Your account is under review. You will be notified once approved.
 *               rejected:
 *                 summary: Application rejected
 *                 value:
 *                   success: false
 *                   message: Your account application was rejected. Please contact support.
 *               suspended:
 *                 summary: Account suspended
 *                 value:
 *                   success: false
 *                   message: Account has been suspended. Please contact support.
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.post(
    '/login',
    authLimiter,
    [v.email, body('password').notEmpty().withMessage('Password is required')],
    validate,
    ownerController.login,
);

// ════════════════════════════════════════════════════════════════════════════════
// TOKEN MANAGEMENT
// ════════════════════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /theatre-owner/refresh-token:
 *   post:
 *     summary: Rotate refresh token
 *     description: |
 *       Exchanges a valid refresh token for a new access + refresh token pair.
 *       The submitted refresh token is immediately revoked (rotation).
 *       Token reuse (submitting an already-used token) triggers revocation of
 *       all tokens in that token family — all devices are logged out.
 *     tags: [TheatreOwner — Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: a3f9c2e1b4d7...
 *     responses:
 *       200:
 *         description: New token pair issued
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         accessToken:
 *                           type: string
 *                         refreshToken:
 *                           type: string
 *       401:
 *         description: Refresh token invalid, expired, or reused
 */
router.post(
    '/refresh-token',
    [v.refreshToken],
    validate,
    ownerController.refreshToken,
);

/**
 * @swagger
 * /theatre-owner/logout:
 *   post:
 *     summary: Log out current session
 *     description: Revokes the submitted refresh token. The access token expires naturally.
 *     tags: [TheatreOwner — Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post('/logout', [v.refreshToken], validate, ownerController.logout);

/**
 * @swagger
 * /theatre-owner/logout-all:
 *   post:
 *     summary: Terminate all sessions
 *     description: |
 *       Revokes **all** refresh tokens for this owner across every device.
 *       Requires a valid access token. Use when the owner suspects a compromised session.
 *     tags: [TheatreOwner — Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: All sessions terminated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/logout-all', ownerGuard, ownerController.logoutAll);

// ════════════════════════════════════════════════════════════════════════════════
// PROFILE — read-only / password
// ════════════════════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /theatre-owner/profile:
 *   get:
 *     summary: Get theatre owner profile
 *     description: |
 *       Returns the complete owner document including `onboardingStatus`.
 *       Frontend should gate further actions based on this status:
 *       - `pending_onboarding` / `in_progress` → show onboarding wizard
 *       - `completed` → show full dashboard
 *     tags: [TheatreOwner — Profile]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Profile returned
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         owner:
 *                           $ref: '#/components/schemas/TheatreOwnerPublic'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/profile', ownerGuard, ownerController.getProfile);

/**
 * @swagger
 * /theatre-owner/change-password:
 *   patch:
 *     summary: Change account password
 *     description: |
 *       Verifies the current password then updates to the new one.
 *       On success **all refresh tokens are revoked** — the owner must re-login
 *       on every device.
 *     tags: [TheatreOwner — Profile]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *           example:
 *             currentPassword: Owner@123
 *             newPassword: NewOwner@456
 *     responses:
 *       200:
 *         description: Password changed — all sessions have been terminated
 *       400:
 *         description: Validation error or wrong current password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               wrongPassword:
 *                 value: { success: false, message: Current password is incorrect }
 *               samePassword:
 *                 value: { success: false, message: New password must differ from current password }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.patch(
    '/change-password',
    ownerGuard,
    [v.currentPassword, v.newPassword],
    validate,
    ownerController.changePassword,
);

// ════════════════════════════════════════════════════════════════════════════════
// PASSWORD RESET FLOW
// ════════════════════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /theatre-owner/forgot-password:
 *   post:
 *     summary: Request password reset (Step 1 - Send OTP)
 *     description: |
 *       Initiates password reset flow. Sends a 6-digit OTP to registered email.
 *       OTP is valid for 10 minutes.
 *     tags: [TheatreOwner — Auth]
 *     x-rateLimit: authLimiter
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: priya@inoxcinemas.com
 *     responses:
 *       200:
 *         description: OTP sent to email
 *       404:
 *         description: Email not found
 */
router.post(
    '/forgot-password',
    authLimiter,
    [v.email],
    validate,
    ownerController.requestPasswordReset,
);

/**
 * @swagger
 * /theatre-owner/verify-otp:
 *   post:
 *     summary: Verify OTP and generate reset token (Step 2)
 *     description: |
 *       Verifies the OTP and generates a password reset token.
 *       Reset token is sent via email and valid for 15 minutes.
 *     tags: [TheatreOwner — Auth]
 *     x-rateLimit: authLimiter
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP verified, reset link sent to email
 *       400:
 *         description: Invalid or expired OTP
 */
router.post(
    '/verify-otp',
    authLimiter,
    [v.email, body('otp').notEmpty().withMessage('OTP is required')],
    validate,
    ownerController.verifyOTPAndGenerateToken,
);

/**
 * @swagger
 * /theatre-owner/reset-password:
 *   post:
 *     summary: Reset password (Step 3)
 *     description: |
 *       Completes password reset using the reset token from email.
 *       All refresh tokens are revoked after reset.
 *     tags: [TheatreOwner — Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, resetToken, newPassword]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               resetToken:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired token
 */
router.post(
    '/reset-password',
    [v.email, body('resetToken').notEmpty().withMessage('Reset token is required'), v.newPassword],
    validate,
    ownerController.resetPassword,
);

// ════════════════════════════════════════════════════════════════════════════════
// STEP 3 — ONBOARDING
// ════════════════════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /theatre-owner/onboarding:
 *   patch:
 *     summary: Save onboarding profile data
 *     description: |
 *       **Step 3 of the theatre owner flow** (after admin approval + login).
 *
 *       The frontend onboarding wizard sends this endpoint progressively.
 *       **Partial saves are supported** — the owner can save and resume.
 *
 *       Status transitions:
 *       - First call → `onboardingStatus: in_progress`
 *       - When all required fields are present → `onboardingStatus: completed` (automatic)
 *
 *       Required fields for completion:
 *       - `theatreInfo.theatreName`, `theatreInfo.contactPhone`, `theatreInfo.contactEmail`
 *       - `location.streetAddress`, `location.city`, `location.state`, `location.pincode`
 *
 *       Once completed, this endpoint returns 409. Use `PATCH /profile` instead.
 *
 *       All other fields (`isMultiplex`, `amenities.*`, `cancellationPolicy.*`,
 *       `theatreInfo.website`, `name`) are optional for completion.
 *     tags: [TheatreOwner — Onboarding]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TheatreOwnerOnboardingRequest'
 *           examples:
 *             partialSave:
 *               summary: First partial save (in_progress)
 *               value:
 *                 name: Priya Nair
 *                 isMultiplex: true
 *                 theatreInfo:
 *                   theatreName: INOX Multiplex
 *                   contactPhone: "+918800123456"
 *             completeSave:
 *               summary: Final save (triggers completed)
 *               value:
 *                 name: Priya Nair
 *                 isMultiplex: true
 *                 theatreInfo:
 *                   theatreName: INOX Multiplex
 *                   website: https://inoxmovies.com
 *                   contactPhone: "+918800123456"
 *                   contactEmail: contact@inoxcinemas.com
 *                 location:
 *                   streetAddress: 42 MG Road, Indiranagar
 *                   city: Bengaluru
 *                   state: Karnataka
 *                   pincode: "560038"
 *                 amenities:
 *                   parking: true
 *                   foodCourt: true
 *                   dolbySound: true
 *                   threeD: true
 *                   reclinerSeats: true
 *                 cancellationPolicy:
 *                   allowCancellations: true
 *                   cutoffHours: 3
 *                   refundPercentage: 75
 *     responses:
 *       200:
 *         description: Onboarding progress saved (or completed)
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         owner:
 *                           $ref: '#/components/schemas/TheatreOwnerPublic'
 *                         onboardingComplete:
 *                           type: boolean
 *                           description: true when all required fields are now filled
 *             examples:
 *               inProgress:
 *                 summary: Partial save
 *                 value:
 *                   success: true
 *                   message: Onboarding progress saved
 *                   data:
 *                     owner:
 *                       onboardingStatus: in_progress
 *                     onboardingComplete: false
 *               completed:
 *                 summary: All required fields present
 *                 value:
 *                   success: true
 *                   message: Onboarding completed successfully
 *                   data:
 *                     owner:
 *                       onboardingStatus: completed
 *                     onboardingComplete: true
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       409:
 *         description: Onboarding already completed — use PATCH /profile instead
 */
router.patch(
    '/onboarding',
    ownerGuard,
    [
        body('name').optional().trim().isLength({ max: 150 }).withMessage('Name must be 150 chars or fewer'),
        body('isMultiplex').optional().isBoolean().withMessage('isMultiplex must be a boolean'),
        v.onboarding.theatreName,
        v.onboarding.website,
        v.onboarding.contactPhone,
        v.onboarding.contactEmail,
        v.onboarding.streetAddress,
        v.onboarding.city,
        v.onboarding.state,
        v.onboarding.pincode,
        ...amenityValidators,
        ...cancellationValidators,
    ],
    validate,
    ownerController.saveOnboarding,
);

// ════════════════════════════════════════════════════════════════════════════════
// STEP 4 — PROFILE UPDATE (post-onboarding, ongoing)
// ════════════════════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /theatre-owner/profile:
 *   patch:
 *     summary: Update theatre owner profile
 *     description: |
 *       **Step 4 / ongoing** — available after onboarding is completed.
 *
 *       Partial update — only include the fields you want to change.
 *
 *       **Restrictions:**
 *       - `theatreInfo.theatreName` is immutable after registration — contact support to rename
 *       - `onboardingStatus` cannot be changed via this endpoint
 *
 *       All other fields in `theatreInfo`, `location`, `amenities`,
 *       `cancellationPolicy`, `name`, and `isMultiplex` are updatable.
 *     tags: [TheatreOwner — Profile]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TheatreOwnerUpdateRequest'
 *           example:
 *             name: Priya Krishnan
 *             isMultiplex: false
 *             theatreInfo:
 *               website: https://updated-inox.com
 *               contactPhone: "+919900001111"
 *             amenities:
 *               lounge: true
 *               fourDX: true
 *             cancellationPolicy:
 *               cutoffHours: 6
 *               refundPercentage: 50
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         owner:
 *                           $ref: '#/components/schemas/TheatreOwnerPublic'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.patch(
    '/profile',
    ownerGuard,
    [
        body('name').optional().trim().isLength({ max: 150 }).withMessage('Name must be 150 chars or fewer'),
        body('isMultiplex').optional().isBoolean().withMessage('isMultiplex must be a boolean'),
        v.onboarding.website,
        v.onboarding.contactPhone,
        v.onboarding.contactEmail,
        v.onboarding.streetAddress,
        v.onboarding.city,
        v.onboarding.state,
        v.onboarding.pincode,
        ...amenityValidators,
        ...cancellationValidators,
    ],
    validate,
    ownerController.updateProfile,
);

// ════════════════════════════════════════════════════════════════════════════════
// DOCUMENT MANAGEMENT
// ════════════════════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /theatre-owner/documents:
 *   post:
 *     summary: Upload an additional supporting document
 *     description: |
 *       Allows the owner to add a document at any point after registration
 *       (e.g. upload a NOC after the theatre is approved).
 *
 *       Accepts `multipart/form-data`:
 *       - `document` — the file (JPEG/PNG/WebP/PDF, max 10 MB)
 *       - `docType` — one of the allowed document type values
 *     tags: [TheatreOwner — Documents]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [document, docType]
 *             properties:
 *               document:
 *                 type: string
 *                 format: binary
 *                 description: Document file (JPEG/PNG/WebP/PDF, max 10 MB)
 *               docType:
 *                 type: string
 *                 enum: [gst_certificate, business_registration, trade_license, pan_card, identity_proof, address_proof, noc, other]
 *                 example: noc
 *     responses:
 *       201:
 *         description: Document uploaded
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         owner:
 *                           $ref: '#/components/schemas/TheatreOwnerPublic'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post(
    '/documents',
    ownerGuard,
    uploadDocument,
    [
        body('docType')
            .notEmpty().withMessage('docType is required')
            .isIn(SUPPORTED_DOC_TYPES).withMessage(`docType must be one of: ${SUPPORTED_DOC_TYPES.join(', ')}`),
    ],
    validate,
    ownerController.addDocument,
);

/**
 * @swagger
 * /theatre-owner/documents/{docId}:
 *   delete:
 *     summary: Delete a supporting document
 *     description: |
 *       Removes a document from both Cloudinary and the owner's record.
 *       The last remaining document cannot be deleted — at least one must exist at all times.
 *     tags: [TheatreOwner — Documents]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: docId
 *         required: true
 *         description: MongoDB ObjectId of the document subdocument
 *         schema:
 *           $ref: '#/components/schemas/MongoId'
 *     responses:
 *       200:
 *         description: Document deleted
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         owner:
 *                           $ref: '#/components/schemas/TheatreOwnerPublic'
 *       400:
 *         description: Cannot delete last document
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Document not found
 */
router.delete(
    '/documents/:docId',
    ownerGuard,
    [param('docId').isMongoId().withMessage('Invalid document ID')],
    validate,
    ownerController.deleteDocument,
);

export default router;