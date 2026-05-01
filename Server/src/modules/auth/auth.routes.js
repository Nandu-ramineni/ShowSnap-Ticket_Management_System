import { Router } from 'express';
import { body } from 'express-validator';
import * as authController from './auth.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authLimiter } from '../../middlewares/rateLimiter.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { REGISTERABLE_ROLES } from '../../utils/constants.js';

// ─── Validators ───────────────────────────────────────────────────────────────

const PASSWORD_COMPLEXITY =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?])/;

const validators = {
  name: body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 100 }).withMessage('Name must be 100 chars or fewer'),

  email: body('email')
    .isEmail().withMessage('Valid email required')
    .normalizeEmail(),

  phone: body('phone')
    .optional({ nullable: true })
    .isMobilePhone().withMessage('Valid phone number required'),

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

  role: body('role')
    .optional()
    .isIn(REGISTERABLE_ROLES)
    .withMessage(`role must be one of: ${REGISTERABLE_ROLES.join(', ')}`),
};

const router = Router();

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and user profile management
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user or theatre owner
 *     description: >
 *       Creates a new account. Regular users (`role: user`) are activated
 *       immediately and receive tokens. Theatre owners (`role: theatre_owner`)
 *       are created with `accountStatus: pending` and receive **no tokens** —
 *       they must wait for admin approval before they can log in.
 *       The `admin` role cannot be self-assigned; use the seed script.
 *     tags: [Auth]
 *     x-rateLimit: authLimiter
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           examples:
 *             user:
 *               summary: Regular user
 *               value:
 *                 name: Arjun Mehta
 *                 email: arjun@example.com
 *                 password: Secret@123
 *                 phone: "+919876543210"
 *             theatreOwner:
 *               summary: Theatre owner (requires admin approval)
 *               value:
 *                 name: Priya Nair
 *                 email: priya@inoxcinemas.com
 *                 password: Secret@123
 *                 role: theatre_owner
 *     responses:
 *       201:
 *         description: >
 *           Registration successful. For regular users, tokens are included.
 *           For theatre owners, tokens are omitted and `accountStatus` is `pending`.
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
 *                         user:
 *                           $ref: '#/components/schemas/UserPublic'
 *                         accessToken:
 *                           type: string
 *                           nullable: true
 *                           description: Absent when accountStatus is pending
 *                         refreshToken:
 *                           type: string
 *                           nullable: true
 *                           description: Absent when accountStatus is pending
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
  [validators.name, validators.email, validators.password, validators.phone, validators.role],
  validate,
  authController.register,
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in and receive JWT tokens
 *     description: >
 *       Validates credentials and returns a short-lived access token and a
 *       long-lived refresh token. Theatre owners with `accountStatus: pending`
 *       or `accountStatus: rejected` will receive a 403 with a descriptive
 *       message. Suspended accounts (`isActive: false`) also receive a 403.
 *     tags: [Auth]
 *     x-rateLimit: authLimiter
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           example:
 *             email: arjun@example.com
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
 *                       $ref: '#/components/schemas/AuthTokens'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account pending approval, rejected, or suspended
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
  [validators.email, body('password').notEmpty().withMessage('Password is required')],
  validate,
  authController.login,
);

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Rotate tokens using a refresh token
 *     description: >
 *       Issues a new access token and refresh token pair. The old refresh token
 *       is invalidated immediately (token rotation). If a previously used token
 *       is detected (reuse attack), the entire token family is revoked and all
 *       sessions for that user are terminated.
 *     tags: [Auth]
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
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Invalid, expired, or reused refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalid:
 *                 value: { success: false, message: Invalid refresh token }
 *               expired:
 *                 value: { success: false, message: Refresh token expired }
 *               reuse:
 *                 value: { success: false, message: Refresh token reuse detected — all sessions invalidated }
 */
router.post(
  '/refresh-token',
  [validators.refreshToken],
  validate,
  authController.refreshToken,
);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Log out of the current session
 *     description: >
 *       Invalidates the provided refresh token. The access token will remain
 *       valid until it expires naturally (TTL is short by design). The client
 *       should discard both tokens immediately after calling this endpoint.
 *     tags: [Auth]
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
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  '/logout',
  [validators.refreshToken],
  validate,
  authController.logout,
);

/**
 * @swagger
 * /auth/logout-all:
 *   post:
 *     summary: Terminate all active sessions
 *     description: >
 *       Revokes every refresh token belonging to the authenticated user across
 *       all devices. Use this after a password change or suspected account
 *       compromise. Requires a valid access token — the current session's
 *       refresh token is also revoked.
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: All sessions terminated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/logout-all', authenticate, authController.logoutAll);

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get the authenticated user's profile
 *     tags: [Auth]
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
 *                         user:
 *                           $ref: '#/components/schemas/UserPublic'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   patch:
 *     summary: Update profile fields
 *     description: >
 *       Partial update — only include fields you want to change.
 *       Allowed fields: `name`, `phone`, `preferredCity`, `avatar`.
 *       All other fields are silently ignored.
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileRequest'
 *           example:
 *             name: Arjun Kumar Mehta
 *             preferredCity: Mumbai
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
 *                         user:
 *                           $ref: '#/components/schemas/UserPublic'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/profile', authenticate, authController.getProfile);
router.patch(
  '/profile',
  authenticate,
  [
    validators.name.optional(),
    validators.phone,
    body('preferredCity').optional().trim().isLength({ max: 100 }).withMessage('City must be 100 chars or fewer'),
    body('avatar').optional().isURL().withMessage('Avatar must be a valid URL'),
  ],
  validate,
  authController.updateProfile,
);

/**
 * @swagger
 * /auth/change-password:
 *   patch:
 *     summary: Change account password
 *     description: >
 *       Verifies the current password, then updates it. On success, **all
 *       refresh tokens are revoked** across all devices — the user must
 *       log in again on every device. The current access token remains valid
 *       until it expires (short TTL).
 *     tags: [Auth]
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Validation failed or current password is incorrect
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               wrongPassword:
 *                 value: { success: false, message: Current password is incorrect }
 *               samePassword:
 *                 value: { success: false, message: New password must differ from current password }
 *               validation:
 *                 $ref: '#/components/examples/ValidationErrorExample'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch(
  '/change-password',
  authenticate,
  [validators.currentPassword, validators.newPassword],
  validate,
  authController.changePassword,
);

export default router;