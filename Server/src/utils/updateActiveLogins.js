import refreshTokenModel from "../modules/auth/refreshToken.model.js";
import theatreOwnerModel from "../modules/auth/theatreOwner.model.js";
import logger from "./logger.js";

export const updateActiveLogins = async (userId) => {
    try {
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
    } catch (error) {
        logger.warn(`Failed to update active logins for ${userId}: ${error.message}`);
        return 0;
    }
};