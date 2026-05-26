import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../utils/validate.js';
import { ROLES, ACCOUNT_STATUS } from '../../utils/constants.js';
import {
    getPendingApprovals,
    approveTheatreOwner,
    rejectTheatreOwner,
    getAllOwners,
    suspendUser,
    reactivateUser,
} from './admin.controller.js';

const adminGuard = [authenticate, authorize(ROLES.ADMIN)];

const router = Router();

// ─── Approval Queue ───────────────────────────────────────────────────────────

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
    getPendingApprovals,
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
    approveTheatreOwner,
);

/**
 * @swagger
 * /admin/approvals/{ownerId}/reject:
 *   patch:
 *     summary: Reject a theatre owner's account
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ownerId
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
    '/approvals/:ownerId/reject',
    adminGuard,
    [
        param('ownerId').isMongoId().withMessage('Invalid owner ID'),
        body('reason')
            .trim()
            .notEmpty().withMessage('Rejection reason is required')
            .isLength({ max: 500 }).withMessage('Reason must be 500 characters or fewer'),
    ],
    validate,
    rejectTheatreOwner,
);

// ─── Owner Management ─────────────────────────────────────────────────────────

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
    getAllOwners,
);

// ─── User Lifecycle ───────────────────────────────────────────────────────────

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
    suspendUser,
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
    reactivateUser,
);

export default router;
 