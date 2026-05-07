import { Router } from 'express';
import { body, param, query } from 'express-validator';
// FIX: was importing authorize from '../../middlewares/authorize.middleware.js'
//      — that file doesn't exist. authorize is already exported from auth.middleware.js.
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
// FIX: was importing validate from '../../middlewares/validate.middleware.js'
//      — that file doesn't exist. validate lives in utils/validate.js.
import { validate } from '../../utils/validate.js';
import { ROLES, ACCOUNT_STATUS } from '../../utils/constants.js';
import * as adminService from './admin.service.js';

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const adminGuard = [authenticate, authorize(ROLES.ADMIN)];

const router = Router();

// ─── Approval queue ───────────────────────────────────────────────────────────

/**
 * @swagger
 * /admin/approvals:
 *   get:
 *     summary: List theatre owners awaiting approval
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated list of pending owners
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get(
    '/approvals',
    adminGuard,
    [
        query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be 1–100'),
    ],
    validate,
    asyncHandler(async (req, res) => {
        const data = await adminService.getPendingApprovals({
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 20,
        });
        res.json({ success: true, data });
    })
);

/**
 * @swagger
 * /admin/approvals/{userId}/approve:
 *   patch:
 *     summary: Approve a theatre owner's account
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Account approved
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: Already reviewed
 */
router.patch(
    '/approvals/:userId/approve',
    adminGuard,
    [param('userId').isMongoId().withMessage('Invalid user ID')],
    validate,
    asyncHandler(async (req, res) => {
        const user = await adminService.approveOwner(req.params.userId);
        res.json({ success: true, data: { user }, message: 'Account approved' });
    })
);

/**
 * @swagger
 * /admin/approvals/{userId}/reject:
 *   patch:
 *     summary: Reject a theatre owner's account
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason]
 *             properties:
 *               reason:
 *                 type: string
 *                 example: Incomplete business registration documents
 *     responses:
 *       200:
 *         description: Account rejected
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: Already reviewed
 */
router.patch(
    '/approvals/:userId/reject',
    adminGuard,
    [
        param('userId').isMongoId().withMessage('Invalid user ID'),
        body('reason')
            .trim()
            .notEmpty().withMessage('Rejection reason is required')
            .isLength({ max: 500 }).withMessage('Reason must be 500 characters or fewer'),
    ],
    validate,
    asyncHandler(async (req, res) => {
        const user = await adminService.rejectOwner(req.params.userId, req.body.reason);
        res.json({ success: true, data: { user }, message: 'Account rejected' });
    })
);

// ─── Owner management ─────────────────────────────────────────────────────────

/**
 * @swagger
 * /admin/owners:
 *   get:
 *     summary: List all theatre owners, optionally filtered by status
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, active, rejected]
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated list of theatre owners
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get(
    '/owners',
    adminGuard,
    [
        query('status').optional()
            .isIn(Object.values(ACCOUNT_STATUS))
            .withMessage(`status must be one of: ${Object.values(ACCOUNT_STATUS).join(', ')}`),
        query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be 1–100'),
    ],
    validate,
    asyncHandler(async (req, res) => {
        const data = await adminService.getAllOwners({
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 20,
            status: req.query.status,
        });
        res.json({ success: true, data });
    })
);

/**
 * @swagger
 * /admin/users/{userId}/suspend:
 *   patch:
 *     summary: Suspend a user account and revoke all their sessions
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Account suspended
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch(
    '/users/:userId/suspend',
    adminGuard,
    [param('userId').isMongoId().withMessage('Invalid user ID')],
    validate,
    asyncHandler(async (req, res) => {
        const user = await adminService.setActiveStatus(req.params.userId, false);
        res.json({ success: true, data: { user }, message: 'Account suspended' });
    })
);

/**
 * @swagger
 * /admin/users/{userId}/reactivate:
 *   patch:
 *     summary: Reactivate a suspended user account
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Account reactivated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch(
    '/users/:userId/reactivate',
    adminGuard,
    [param('userId').isMongoId().withMessage('Invalid user ID')],
    validate,
    asyncHandler(async (req, res) => {
        const user = await adminService.setActiveStatus(req.params.userId, true);
        res.json({ success: true, data: { user }, message: 'Account reactivated' });
    })
);

// ═══════════════════════════════════════════════════════════════════════════════
// TheatreOwner admin routes
// Targets the dedicated TheatreOwner collection (separate from User).
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /admin/theatre-owners:
 *   get:
 *     summary: List all theatre owners
 *     description: >
 *       Returns a paginated list of all TheatreOwner documents.
 *       Filter by `status` (pending | active | rejected) for targeted queries.
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, active, rejected]
 *     responses:
 *       200:
 *         description: Paginated list of theatre owners
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get(
    '/theatre-owners',
    adminGuard,
    [
        query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be 1–100'),
        query('status').optional().isIn(['pending', 'active', 'rejected']).withMessage('status must be pending | active | rejected'),
    ],
    validate,
    asyncHandler(async (req, res) => {
        const data = await adminService.getAllTheatreOwners({
            page:   parseInt(req.query.page)  || 1,
            limit:  parseInt(req.query.limit) || 20,
            status: req.query.status,
        });
        res.json({ success: true, data });
    })
);

/**
 * @swagger
 * /admin/theatre-owners/pending:
 *   get:
 *     summary: List theatre owners awaiting approval
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated list of pending theatre owners
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get(
    '/theatre-owners/pending',
    adminGuard,
    [
        query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be 1–100'),
    ],
    validate,
    asyncHandler(async (req, res) => {
        const data = await adminService.getPendingOwnerApprovals({
            page:  parseInt(req.query.page)  || 1,
            limit: parseInt(req.query.limit) || 20,
        });
        res.json({ success: true, data });
    })
);

/**
 * @swagger
 * /admin/theatre-owners/{id}/approve:
 *   patch:
 *     summary: Approve a pending theatre owner
 *     description: >
 *       Sets `accountStatus` to `active`. The owner can now log in and
 *       manage their theatre. An approval notification email is queued.
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/MongoId'
 *     responses:
 *       200:
 *         description: Theatre owner approved
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
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
router.patch(
    '/theatre-owners/:id/approve',
    adminGuard,
    [param('id').isMongoId().withMessage('Invalid owner ID')],
    validate,
    asyncHandler(async (req, res) => {
        const owner = await adminService.approveTheatreOwner(req.params.id);
        res.json({ success: true, data: { owner }, message: 'Theatre owner approved' });
    })
);

/**
 * @swagger
 * /admin/theatre-owners/{id}/reject:
 *   patch:
 *     summary: Reject a pending theatre owner
 *     description: >
 *       Sets `accountStatus` to `rejected` and stores the rejection reason.
 *       A rejection notification email is queued.
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/MongoId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason]
 *             properties:
 *               reason:
 *                 type: string
 *                 maxLength: 500
 *                 example: Incomplete business documentation provided.
 *     responses:
 *       200:
 *         description: Theatre owner rejected
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
router.patch(
    '/theatre-owners/:id/reject',
    adminGuard,
    [
        param('id').isMongoId().withMessage('Invalid owner ID'),
        body('reason').trim().notEmpty().withMessage('Rejection reason is required').isLength({ max: 500 }),
    ],
    validate,
    asyncHandler(async (req, res) => {
        const owner = await adminService.rejectTheatreOwner(req.params.id, req.body.reason);
        res.json({ success: true, data: { owner }, message: 'Theatre owner rejected' });
    })
);

/**
 * @swagger
 * /admin/theatre-owners/{id}/suspend:
 *   patch:
 *     summary: Suspend a theatre owner account
 *     description: Sets `isActive` to false and revokes all active sessions.
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/MongoId'
 *     responses:
 *       200:
 *         description: Account suspended
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch(
    '/theatre-owners/:id/suspend',
    adminGuard,
    [param('id').isMongoId().withMessage('Invalid owner ID')],
    validate,
    asyncHandler(async (req, res) => {
        const owner = await adminService.setOwnerActiveStatus(req.params.id, false);
        res.json({ success: true, data: { owner }, message: 'Account suspended' });
    })
);

/**
 * @swagger
 * /admin/theatre-owners/{id}/reactivate:
 *   patch:
 *     summary: Reactivate a suspended theatre owner account
 *     description: Sets `isActive` to true. The owner can log in immediately.
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/MongoId'
 *     responses:
 *       200:
 *         description: Account reactivated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch(
    '/theatre-owners/:id/reactivate',
    adminGuard,
    [param('id').isMongoId().withMessage('Invalid owner ID')],
    validate,
    asyncHandler(async (req, res) => {
        const owner = await adminService.setOwnerActiveStatus(req.params.id, true);
        res.json({ success: true, data: { owner }, message: 'Account reactivated' });
    })
);

export default router;