// FIX: was importing from '../auth/user.model.js' and '../auth/refreshToken.model.js'
//      admin.service.js is already inside modules/auth/ — the '../auth/' prefix
//      resolves to modules/auth/auth/ which doesn't exist → module not found crash.
import User from './user.model.js';
import TheatreOwner from './theatreOwner.model.js';
import RefreshToken from './refreshToken.model.js';
import ApiError from '../../utils/ApiError.js';
import { ROLES, ACCOUNT_STATUS } from '../../utils/constants.js';

// ─── Pending approvals ────────────────────────────────────────────────────────

export const getPendingApprovals = async ({ page = 1, limit = 20 } = {}) => {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
        User.find({ role: ROLES.THEATRE_OWNER, accountStatus: ACCOUNT_STATUS.PENDING })
            .sort({ createdAt: 1 })
            .skip(skip)
            .limit(limit)
            .select('name email phone createdAt accountStatus'),
        User.countDocuments({ role: ROLES.THEATRE_OWNER, accountStatus: ACCOUNT_STATUS.PENDING }),
    ]);

    return {
        users: users.map((u) => u.toPublicJSON()),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
};

// ─── Approve ──────────────────────────────────────────────────────────────────

export const approveOwner = async (userId) => {
    const user = await User.findOne({
        _id: userId,
        role: ROLES.THEATRE_OWNER,
        accountStatus: ACCOUNT_STATUS.PENDING,
    });

    if (!user) {
        const exists = await User.exists({ _id: userId });
        if (!exists) throw ApiError.notFound('User not found');

        const isOwner = await User.exists({ _id: userId, role: ROLES.THEATRE_OWNER });
        if (!isOwner) throw ApiError.badRequest('User is not a theatre owner');

        throw ApiError.conflict('This account has already been reviewed');
    }

    user.accountStatus = ACCOUNT_STATUS.ACTIVE;
    user.rejectionReason = undefined;
    await user.save();

    // TODO: await emailService.sendOwnerApproved(user.email, user.name);

    return user.toPublicJSON();
};

// ─── Reject ───────────────────────────────────────────────────────────────────

export const rejectOwner = async (userId, reason) => {
    const user = await User.findOne({
        _id: userId,
        role: ROLES.THEATRE_OWNER,
        accountStatus: ACCOUNT_STATUS.PENDING,
    });

    if (!user) {
        const exists = await User.exists({ _id: userId });
        if (!exists) throw ApiError.notFound('User not found');

        const isOwner = await User.exists({ _id: userId, role: ROLES.THEATRE_OWNER });
        if (!isOwner) throw ApiError.badRequest('User is not a theatre owner');

        throw ApiError.conflict('This account has already been reviewed');
    }

    user.accountStatus = ACCOUNT_STATUS.REJECTED;
    user.rejectionReason = reason;
    await user.save();

    // TODO: await emailService.sendOwnerRejected(user.email, user.name, reason);

    return user.toPublicJSON();
};

// ─── All owners ───────────────────────────────────────────────────────────────

export const getAllOwners = async ({ page = 1, limit = 20, status } = {}) => {
    const filter = { role: ROLES.THEATRE_OWNER };
    if (status && Object.values(ACCOUNT_STATUS).includes(status)) {
        filter.accountStatus = status;
    }

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
        User.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('name email phone createdAt accountStatus isActive ownedTheatre'),
        User.countDocuments(filter),
    ]);

    return {
        users: users.map((u) => u.toPublicJSON()),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
};

// ─── Suspend / reactivate ─────────────────────────────────────────────────────

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
// TheatreOwner admin operations
// These mirror the User-based owner ops above but target the TheatreOwner
// collection, now that owner data lives in its own model.
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Pending TheatreOwner approvals ───────────────────────────────────────────

export const getPendingOwnerApprovals = async ({ page = 1, limit = 20 } = {}) => {
    const skip = (page - 1) * limit;

    const [owners, total] = await Promise.all([
        TheatreOwner.find({ accountStatus: ACCOUNT_STATUS.PENDING })
            .sort({ createdAt: 1 })
            .skip(skip)
            .limit(limit)
            .select('email theatreInfo location isMultiplex createdAt accountStatus'),
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
        _id:           ownerId,
        accountStatus: ACCOUNT_STATUS.PENDING,
    });

    if (!owner) {
        const exists = await TheatreOwner.exists({ _id: ownerId });
        if (!exists) throw ApiError.notFound('Theatre owner not found');
        throw ApiError.conflict('This account has already been reviewed');
    }

    owner.accountStatus    = ACCOUNT_STATUS.ACTIVE;
    owner.rejectionReason  = undefined;
    await owner.save();

    // TODO: await emailService.sendOwnerApproved(owner.email, owner.theatreInfo.theatreName);

    return owner.toPublicJSON();
};

// ─── Reject TheatreOwner ──────────────────────────────────────────────────────

export const rejectTheatreOwner = async (ownerId, reason) => {
    const owner = await TheatreOwner.findOne({
        _id:           ownerId,
        accountStatus: ACCOUNT_STATUS.PENDING,
    });

    if (!owner) {
        const exists = await TheatreOwner.exists({ _id: ownerId });
        if (!exists) throw ApiError.notFound('Theatre owner not found');
        throw ApiError.conflict('This account has already been reviewed');
    }

    owner.accountStatus   = ACCOUNT_STATUS.REJECTED;
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

// ─── Suspend / reactivate TheatreOwner ───────────────────────────────────────

export const setOwnerActiveStatus = async (ownerId, isActive) => {
    const owner = await TheatreOwner.findByIdAndUpdate(
        ownerId,
        { isActive },
        { new: true }
    );
    if (!owner) throw ApiError.notFound('Theatre owner not found');

    // Revoke all sessions when suspending
    if (!isActive) await RefreshToken.deleteMany({ userId: ownerId });

    return owner.toPublicJSON();
};