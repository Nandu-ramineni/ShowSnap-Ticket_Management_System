import User from '../auth/user.model.js';
import RefreshToken from '../auth/refreshToken.model.js';
import ApiError from '../../utils/ApiError.js';
import { ROLES, ACCOUNT_STATUS } from '../../utils/constants.js';

// ─── Pending approvals ────────────────────────────────────────────────────────

export const getPendingApprovals = async ({ page = 1, limit = 20 } = {}) => {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
        User.find({ role: ROLES.THEATRE_OWNER, accountStatus: ACCOUNT_STATUS.PENDING })
            .sort({ createdAt: 1 })   // oldest first — FIFO review queue
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
        // Be specific: the user might not exist, might not be a theatre owner,
        // or might have already been reviewed. Each is a different problem.
        const exists = await User.exists({ _id: userId });
        if (!exists) throw ApiError.notFound('User not found');

        const isOwner = await User.exists({ _id: userId, role: ROLES.THEATRE_OWNER });
        if (!isOwner) throw ApiError.badRequest('User is not a theatre owner');

        throw ApiError.conflict('This account has already been reviewed');
    }

    user.accountStatus = ACCOUNT_STATUS.ACTIVE;
    user.rejectionReason = undefined; // clear any previous rejection
    await user.save();

    // TODO: send approval email notification here
    // await emailService.sendOwnerApproved(user.email, user.name);

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

    // TODO: send rejection email with reason
    // await emailService.sendOwnerRejected(user.email, user.name, reason);

    return user.toPublicJSON();
};

// ─── All owners (for admin management panel) ──────────────────────────────────

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

// ─── Suspend / reactivate any account ────────────────────────────────────────

export const setActiveStatus = async (userId, isActive) => {
    const user = await User.findByIdAndUpdate(
        userId,
        { isActive },
        { new: true }
    );
    if (!user) throw ApiError.notFound('User not found');

    // Revoke all sessions immediately when suspending.
    if (!isActive) await RefreshToken.deleteMany({ userId });

    return user.toPublicJSON();
};