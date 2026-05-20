import refreshTokenModel from "../modules/auth/refreshToken.model.js";
import theatreOwnerModel from "../modules/auth/theatreOwner.model.js";


export const updateActiveLogins = async (userId) => {
    const activeSessions = await refreshTokenModel.countDocuments({
        userId,
        expiresAt: { $gt: new Date() },
        usedAt: null,
    });

    await theatreOwnerModel.findByIdAndUpdate(userId, {
        $set: {
            'traction.activeLogins': activeSessions,
        },
    });

    return activeSessions;
};