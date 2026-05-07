import { Router } from 'express';
import { body } from 'express-validator';
import * as ownerController from './theatreOwner.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { authLimiter } from '../../middlewares/rateLimiter.middleware.js';
import { validate } from '../../utils/validate.js';
import { ROLES } from '../../utils/constants.js';

const router = Router();

// Only authenticated theatre_owners can access protected routes
const ownerGuard = [authenticate, authorize(ROLES.THEATRE_OWNER)];

// ─── Shared validators ────────────────────────────────────────────────────────

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

    // Theatre info
    theatreName: body('theatreInfo.theatreName')
        .trim()
        .notEmpty().withMessage('Theatre name is required')
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

    // Location
    streetAddress: body('location.streetAddress')
        .trim()
        .notEmpty().withMessage('Street address is required')
        .isLength({ max: 200 }).withMessage('Street address must be 200 chars or fewer'),

    city: body('location.city')
        .trim()
        .notEmpty().withMessage('City is required')
        .isLength({ max: 100 }).withMessage('City must be 100 chars or fewer'),

    state: body('location.state')
        .trim()
        .notEmpty().withMessage('State is required')
        .isLength({ max: 100 }).withMessage('State must be 100 chars or fewer'),

    pincode: body('location.pincode')
        .trim()
        .notEmpty().withMessage('Pincode is required')
        .matches(/^\d{4,10}$/).withMessage('Pincode must be 4–10 digits'),
};

// ─── Amenities boolean validators (all optional on register & update) ─────────
const amenityFields = [
    'parking', 'foodCourt', 'wheelchairAccess', 'mTicket',
    'threeD', 'dolbySound', 'fourDX', 'reclinerSeats', 'atm', 'playing', 'lounge',
];
const amenityValidators = amenityFields.map((f) =>
    body(`amenities.${f}`).optional().isBoolean().withMessage(`amenities.${f} must be a boolean`)
);

// Cancellation policy validators
const cancellationValidators = [
    body('cancellationPolicy.allowCancellations')
        .optional()
        .isBoolean().withMessage('allowCancellations must be a boolean'),
    body('cancellationPolicy.cutoffHours')
        .optional()
        .isFloat({ min: 0, max: 720 }).withMessage('cutoffHours must be between 0 and 720'),
    body('cancellationPolicy.refundPercentage')
        .optional()
        .isFloat({ min: 0, max: 100 }).withMessage('refundPercentage must be between 0 and 100'),
];

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * @swagger
 * tags:
 *   name: TheatreOwner
 *   description: Theatre owner registration, authentication and profile management
 */

/**
 * @swagger
 * /theatre-owner/register:
 *   post:
 *     summary: Register a new theatre owner
 *     description: >
 *       Submits a theatre owner application. The account is created with
 *       `accountStatus: pending` and **no tokens are issued** until an admin
 *       approves the application via `PATCH /admin/owners/:id/approve`.
 *     tags: [TheatreOwner]
 *     x-rateLimit: authLimiter
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TheatreOwnerRegisterRequest'
 *           example:
 *             email: priya@inoxcinemas.com
 *             password: Secret@123
 *             isMultiplex: true
 *             theatreInfo:
 *               theatreName: INOX Multiplex
 *               website: https://inoxmovies.com
 *               contactPhone: "+918800123456"
 *               contactEmail: contact@inoxcinemas.com
 *             location:
 *               streetAddress: 42 MG Road, Indiranagar
 *               city: Bengaluru
 *               state: Karnataka
 *               pincode: "560038"
 *             amenities:
 *               parking: true
 *               foodCourt: true
 *               dolbySound: true
 *               threeD: true
 *             cancellationPolicy:
 *               allowCancellations: true
 *               cutoffHours: 3
 *               refundPercentage: 75
 *     responses:
 *       201:
 *         description: Application submitted — awaiting admin approval
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
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.post(
    '/register',
    authLimiter,
    [
        v.email, v.password,
        body('isMultiplex').optional().isBoolean().withMessage('isMultiplex must be a boolean'),
        v.theatreName, v.website, v.contactPhone, v.contactEmail,
        v.streetAddress, v.city, v.state, v.pincode,
        ...amenityValidators,
        ...cancellationValidators,
    ],
    validate,
    ownerController.register,
);

/**
 * @swagger
 * /theatre-owner/login:
 *   post:
 *     summary: Log in as a theatre owner
 *     description: >
 *       Validates credentials and returns JWT token pair.
 *       Accounts with `accountStatus: pending` or `rejected` receive a 403.
 *       Suspended accounts (`isActive: false`) also receive a 403.
 *     tags: [TheatreOwner]
 *     x-rateLimit: authLimiter
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           example:
 *             email: priya@inoxcinemas.com
 *             password: Secret@123
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
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account pending, rejected, or suspended
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               pending:
 *                 value:
 *                   success: false
 *                   message: Your account is under review. You will be notified once approved.
 *               rejected:
 *                 value:
 *                   success: false
 *                   message: Your account application was rejected. Please contact support.
 *               suspended:
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

/**
 * @swagger
 * /theatre-owner/refresh-token:
 *   post:
 *     summary: Rotate refresh token
 *     description: >
 *       Issues a new access + refresh token pair. The previous refresh token
 *       is immediately invalidated (rotation). Token reuse triggers full
 *       session revocation for that token family.
 *     tags: [TheatreOwner]
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
 *         description: Invalid, expired, or reused refresh token
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
 *     tags: [TheatreOwner]
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
router.post(
    '/logout',
    [v.refreshToken],
    validate,
    ownerController.logout,
);

/**
 * @swagger
 * /theatre-owner/logout-all:
 *   post:
 *     summary: Terminate all sessions
 *     description: >
 *       Revokes every refresh token for the authenticated theatre owner across
 *       all devices. Requires a valid access token.
 *     tags: [TheatreOwner]
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

/**
 * @swagger
 * /theatre-owner/profile:
 *   get:
 *     summary: Get theatre owner profile
 *     tags: [TheatreOwner]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Profile returned successfully
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
 *   patch:
 *     summary: Update theatre owner profile
 *     description: >
 *       Partial update — only include fields you want to change.
 *       `theatreInfo.theatreName` is immutable after registration (contact support to change).
 *       All other nested fields can be updated freely.
 *     tags: [TheatreOwner]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TheatreOwnerUpdateRequest'
 *           example:
 *             isMultiplex: false
 *             theatreInfo:
 *               website: https://newsite.com
 *               contactPhone: "+919900001111"
 *             amenities:
 *               parking: true
 *               lounge: true
 *             cancellationPolicy:
 *               allowCancellations: true
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
router.get('/profile', ownerGuard, ownerController.getProfile);
router.patch(
    '/profile',
    ownerGuard,
    [
        body('isMultiplex').optional().isBoolean().withMessage('isMultiplex must be a boolean'),
        v.website, v.contactPhone, v.contactEmail,
        body('location.streetAddress').optional().trim().isLength({ max: 200 }).withMessage('Street address must be 200 chars or fewer'),
        body('location.city').optional().trim().isLength({ max: 100 }).withMessage('City must be 100 chars or fewer'),
        body('location.state').optional().trim().isLength({ max: 100 }).withMessage('State must be 100 chars or fewer'),
        body('location.pincode').optional().matches(/^\d{4,10}$/).withMessage('Pincode must be 4–10 digits'),
        ...amenityValidators,
        ...cancellationValidators,
    ],
    validate,
    ownerController.updateProfile,
);

/**
 * @swagger
 * /theatre-owner/change-password:
 *   patch:
 *     summary: Change account password
 *     description: >
 *       Verifies the current password then updates it. On success,
 *       **all refresh tokens are revoked** — the owner must log in again on every device.
 *     tags: [TheatreOwner]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *           example:
 *             currentPassword: Secret@123
 *             newPassword: NewSecret@456
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

export default router;