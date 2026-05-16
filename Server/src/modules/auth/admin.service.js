// admin.service.js — pure business logic, no req/res/next anywhere.
// All functions are called from admin.controller.js.

import TheatreOwner from './theatreOwner.model.js';
import RefreshToken from './refreshToken.model.js';
import ApiError from '../../utils/ApiError.js';
import { ROLES, ACCOUNT_STATUS } from '../../utils/constants.js';

// ─── Pending User (theatre_owner role) approvals ──────────────────────────────
// Used by GET /admin/approvals — queries the User collection by role.

export const getPendingApprovals = async ({ page = 1, limit = 20 } = {}) => {
    const skip = (page - 1) * limit;
    const [owners, total] = await Promise.all([
        TheatreOwner.find({ accountStatus: ACCOUNT_STATUS.PENDING })
            .sort({ createdAt: 1 })
            .skip(skip)
            .limit(limit)
            .select('name email phone createdAt accountStatus'),
        TheatreOwner.countDocuments({  accountStatus: ACCOUNT_STATUS.PENDING }),
    ]);

    return {
        owners: owners.map((u) => u.toPublicJSON()),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
};

// ─── Approve User (theatre_owner) ─────────────────────────────────────────────

export const approveOwner = async (ownerId) => {
    const owner = await TheatreOwner.findOne({
        _id: ownerId,
        accountStatus: ACCOUNT_STATUS.PENDING,
    });

    if (!owner) {
        const exists = await TheatreOwner.exists({ _id: ownerId });
        if (!exists) throw ApiError.notFound('Theatre owner not found');

        const isOwner = await TheatreOwner.exists({ _id: ownerId });
        if (!isOwner) throw ApiError.badRequest('User is not a theatre owner');

        throw ApiError.conflict('This account has already been reviewed');
    }

    owner.accountStatus = ACCOUNT_STATUS.ACTIVE;
    owner.rejectionReason = undefined;
    await owner.save();

    // TODO: await emailService.sendOwnerApproved(owner.email, owner.name);

    return owner.toPublicJSON();
};

// ─── Reject User (theatre_owner) ──────────────────────────────────────────────

export const rejectOwner = async (ownerId, reason) => {
    const owner = await TheatreOwner.findOne({
        _id: ownerId,
        accountStatus: ACCOUNT_STATUS.PENDING,
    });

    if (!owner) {
        const exists = await TheatreOwner.exists({ _id: ownerId });
        if (!exists) throw ApiError.notFound('Theatre owner not found');

        throw ApiError.conflict('This account has already been reviewed');
    }

    const updatedOwner = await TheatreOwner.findByIdAndUpdate(
        ownerId,
        {
            $set: {
                accountStatus: ACCOUNT_STATUS.REJECTED,
                rejectionReason: reason,
                isActive: false, // Ensure rejected accounts are inactive
            },
        },
        { new: true }
    ).select('+rejectionReason'); // Include rejectionReason in the returned document

    return updatedOwner.toPublicJSON();
};

// ─── List all Users with theatre_owner role ───────────────────────────────────

export const getAllOwners = async ({ page = 1, limit = 20, status } = {}) => {
    const filter = { role: ROLES.THEATRE_OWNER };
    if (status && Object.values(ACCOUNT_STATUS).includes(status)) {
        filter.accountStatus = status;
    }

    const skip = (page - 1) * limit;
    const [owners, total] = await Promise.all([
        TheatreOwner.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('name email phone createdAt accountStatus isActive ownedTheatre'),
        TheatreOwner.countDocuments(filter),
    ]);

    return {
        owners: owners.map((o) => o.toPublicJSON()),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
};

// ─── Suspend / Reactivate User ────────────────────────────────────────────────

export const setActiveStatus = async (userId, isActive) => {
    const user = await User.findByIdAndUpdate(
        userId,
        { isActive },
        { new: true }
    );
    if (!user) throw ApiError.notFound('User not found');

    if (!isActive) await RefreshToken.deleteMany({ userId });

    return user.toPublicJSON();
};

// ═══════════════════════════════════════════════════════════════════════════════
// TheatreOwner-model operations (separate collection from User)
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Pending TheatreOwner approvals ───────────────────────────────────────────

export const getPendingOwnerApprovals = async ({ page = 1, limit = 20 } = {}) => {
    const skip = (page - 1) * limit;

    const [owners, total] = await Promise.all([
        TheatreOwner.find({ accountStatus: ACCOUNT_STATUS.PENDING })
            .sort({ createdAt: 1 })
            .skip(skip)
            .limit(limit),
        TheatreOwner.countDocuments({ accountStatus: ACCOUNT_STATUS.PENDING }),
    ]);

    return {
        owners: owners.map((o) => o.toPublicJSON()),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
};

// ─── Approve TheatreOwner ─────────────────────────────────────────────────────

export const approveTheatreOwner = async (ownerId) => {
    const owner = await TheatreOwner.findOne({
        _id: ownerId,
        accountStatus: ACCOUNT_STATUS.PENDING,
    });

    if (!owner) {
        const exists = await TheatreOwner.exists({ _id: ownerId });
        if (!exists) throw ApiError.notFound('Theatre owner not found');
        throw ApiError.conflict('This account has already been reviewed');
    }

    owner.accountStatus = ACCOUNT_STATUS.ACTIVE;
    owner.rejectionReason = undefined;
    await owner.save();

    // TODO: await emailService.sendOwnerApproved(owner.email, owner.theatreInfo.theatreName);

    return owner.toPublicJSON();
};

// ─── Reject TheatreOwner ──────────────────────────────────────────────────────
// BUG FIX: removed debug console.log statements that were left in from development.

export const rejectTheatreOwner = async (ownerId, reason) => {
    const owner = await TheatreOwner.findOne({
        _id: ownerId,
        accountStatus: ACCOUNT_STATUS.PENDING,
    });

    if (!owner) {
        const exists = await TheatreOwner.exists({ _id: ownerId });
        if (!exists) throw ApiError.notFound('Theatre owner not found');
        throw ApiError.conflict('This account has already been reviewed');
    }

    owner.accountStatus = ACCOUNT_STATUS.REJECTED;
    owner.rejectionReason = reason;
    await owner.save();

    // TODO: await emailService.sendOwnerRejected(owner.email, owner.theatreInfo.theatreName, reason);

    return owner.toPublicJSON();
};

// ─── List all TheatreOwners ───────────────────────────────────────────────────

export const getAllTheatreOwners = async ({ page = 1, limit = 20, status } = {}) => {
    const filter = {};
    if (status && Object.values(ACCOUNT_STATUS).includes(status)) {
        filter.accountStatus = status;
    }

    const skip = (page - 1) * limit;
    const [owners, total] = await Promise.all([
        TheatreOwner.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('email theatreInfo location isMultiplex createdAt accountStatus isActive ownedTheatre'),
        TheatreOwner.countDocuments(filter),
    ]);

    return {
        owners: owners.map((o) => o.toPublicJSON()),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
};

// ─── Suspend / Reactivate TheatreOwner ───────────────────────────────────────

export const setOwnerActiveStatus = async (ownerId, isActive) => {
    const owner = await TheatreOwner.findByIdAndUpdate(
        ownerId,
        { isActive },
        { new: true }
    );
    if (!owner) throw ApiError.notFound('Theatre owner not found');

    if (!isActive) await RefreshToken.deleteMany({ userId: ownerId });

    return owner.toPublicJSON();
};
