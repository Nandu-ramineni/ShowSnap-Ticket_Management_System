import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/authorize.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { ROLES, ACCOUNT_STATUS } from '../../utils/constants.js';
import * as adminService from './admin.service.js';

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// All admin routes require: (1) valid JWT, (2) role === 'admin'.
// Splitting into two middlewares is intentional — authenticate handles
// token verification, authorize handles RBAC. They're separate concerns.
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
 *                 example: "Incomplete business registration documents"
 *     responses:
 *       200:
 *         description: Account rejected
 */
router.patch(
    '/approvals/:userId/reject',
    adminGuard,
    [
        param('userId').isMongoId().withMessage('Invalid user ID'),
        // Require a reason — vague rejections cause support tickets.
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
 */
router.get(
    '/owners',
    adminGuard,
    [
        query('status').optional()
            .isIn(Object.values(ACCOUNT_STATUS))
            .withMessage(`status must be one of: ${Object.values(ACCOUNT_STATUS).join(', ')}`),
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 100 }),
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
 *     summary: Suspend or reactivate any user account
 *     tags: [Admin]
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

export default router;