import * as adminService from './admin.service.js';
import { sendSuccess } from '../../utils/ApiResponse.js';

const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// ─── Approval Queue ───────────────────────────────────────────────────────────

/**
 * GET /admin/approvals
 * List theatre owners awaiting approval (paginated).
 */
export const getPendingApprovals = asyncHandler(async (req, res) => {
    const page  = parseInt(req.query.page,  10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;

    const data = await adminService.getPendingApprovals({ page, limit });
    sendSuccess(res, data, 'Pending approvals retrieved');
});

/**
 * PATCH /admin/approvals/:userId/approve
 * Approve a theatre owner account.
 */
export const approveTheatreOwner = asyncHandler(async (req, res) => {
    const user = await adminService.approveOwner(req.params.userId);
    sendSuccess(res, { user }, 'Account approved');
});

/**
 * PATCH /admin/approvals/:ownerId/reject
 * Reject a theatre owner account with a mandatory reason.
 *
 * BUG FIXED:
 *  - Old version was declared as `async () => { ... }` — missing (req, res, next)
 *    parameters entirely, so req/res were undefined at runtime → instant crash.
 *  - `const reason = req.body` was grabbing the entire body object instead of
 *    `req.body.reason`, so reason was always a non-empty object and the guard
 *    never fired, then `reason` was stored as "[object Object]" in the DB.
 *  - `if (!owner)` guard ran BEFORE `owner` was assigned (hoisting doesn't apply
 *    to const — this was a ReferenceError that crashed before the DB call).
 *  - adminService.rejectOwner / rejectTheatreOwner duplication — unified to call
 *    the correct adminService.rejectTheatreOwner which targets TheatreOwner model.
 */
export const rejectTheatreOwner = asyncHandler(async (req, res) => {
    const { ownerId } = req.params;
    const { reason }  = req.body;           // BUG FIX: was `req.body` (whole object)
    console.log('Rejecting owner', ownerId, 'with reason:', reason);

    // Validation is already handled by express-validator in the route, but we
    // add a defence-in-depth guard here so the controller is self-contained.
    if (!ownerId) {
        return res.status(400).json({ success: false, message: 'Owner ID is required' });
    }
    if (!reason || typeof reason !== 'string' || !reason.trim()) {
        return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }
    if (reason.trim().length > 500) {
        return res.status(400).json({ success: false, message: 'Rejection reason must be 500 characters or fewer' });
    }

    // BUG FIX: owner lookup now happens BEFORE the guard, in the service layer.
    const owner = await adminService.rejectTheatreOwner(ownerId, reason.trim());
    sendSuccess(res, { owner }, 'Account rejected');
});

// ─── Owner Management ─────────────────────────────────────────────────────────

/**
 * GET /admin/owners
 * List all theatre owners, optionally filtered by status.
 */
export const getAllOwners = asyncHandler(async (req, res) => {
    const page   = parseInt(req.query.page,  10) || 1;
    const limit  = parseInt(req.query.limit, 10) || 20;
    const status = req.query.status;

    const data = await adminService.getAllOwners({ page, limit, status });
    sendSuccess(res, data, 'Theatre owners retrieved');
});

// ─── User Lifecycle ───────────────────────────────────────────────────────────

/**
 * PATCH /admin/users/:userId/suspend
 * Suspend a user account and revoke all refresh tokens.
 */
export const suspendUser = asyncHandler(async (req, res) => {
    const user = await adminService.setActiveStatus(req.params.userId, false);
    sendSuccess(res, { user }, 'Account suspended');
});

/**
 * PATCH /admin/users/:userId/reactivate
 * Reactivate a previously suspended user account.
 */
export const reactivateUser = asyncHandler(async (req, res) => {
    const user = await adminService.setActiveStatus(req.params.userId, true);
    sendSuccess(res, { user }, 'Account reactivated');
});
