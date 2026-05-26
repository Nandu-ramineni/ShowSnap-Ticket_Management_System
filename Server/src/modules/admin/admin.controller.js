// BUG FIXED: was importing from '../auth/admin.service.js' which does not exist
// in this codebase — the admin module is self-contained under /modules/admin/.
// This caused a runtime module-not-found crash on every admin request.
import * as adminService from './admin.service.js';
import { sendSuccess } from '../../utils/ApiResponse.js';

const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// ─── Approval Queue ───────────────────────────────────────────────────────────

export const getPendingApprovals = asyncHandler(async (req, res) => {
    const page  = parseInt(req.query.page,  10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;

    const data = await adminService.getPendingApprovals({ page, limit });
    sendSuccess(res, data, 'Pending approvals retrieved');
});

export const approveTheatreOwner = asyncHandler(async (req, res) => {
    const owner = await adminService.approveOwner(req.params.userId);
    sendSuccess(res, { owner }, 'Account approved');
});

export const rejectTheatreOwner = asyncHandler(async (req, res) => {
    const { ownerId } = req.params;
    const { reason }  = req.body;

    // BUG FIX: removed console.log('Rejecting owner', ownerId, 'with reason:', reason)
    // — was leaking owner IDs and rejection reasons to stdout in production.

    if (!ownerId) {
        return res.status(400).json({ success: false, message: 'Owner ID is required' });
    }
    if (!reason || typeof reason !== 'string' || !reason.trim()) {
        return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }
    if (reason.trim().length > 500) {
        return res.status(400).json({ success: false, message: 'Rejection reason must be 500 characters or fewer' });
    }

    const owner = await adminService.rejectOwner(ownerId, reason.trim());
    sendSuccess(res, { owner }, 'Account rejected');
});

// ─── Owner Management ─────────────────────────────────────────────────────────

export const getAllOwners = asyncHandler(async (req, res) => {
    const page   = parseInt(req.query.page,  10) || 1;
    const limit  = parseInt(req.query.limit, 10) || 20;
    const status = req.query.status;

    const data = await adminService.getAllTheatreOwners({ page, limit, status });
    sendSuccess(res, data, 'Theatre owners retrieved');
});

// ─── User Lifecycle ───────────────────────────────────────────────────────────

export const suspendUser = asyncHandler(async (req, res) => {
    const owner = await adminService.setOwnerActiveStatus(req.params.userId, false);
    sendSuccess(res, { owner }, 'Account suspended');
});

export const reactivateUser = asyncHandler(async (req, res) => {
    const owner = await adminService.setOwnerActiveStatus(req.params.userId, true);
    sendSuccess(res, { owner }, 'Account reactivated');
});
