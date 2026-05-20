import { deleteCache } from "../config/redis.js";
import logger from "./logger.js";

export const invalidateOwnerCache = async(ownerId) => {
    try {
        await deleteCache(
            `theatreOwner:profile:${ownerId}`
        );
    } catch (error) {
        // Cache invalidation is non-critical, log and continue
        logger.warn(`Failed to invalidate cache for ${ownerId}: ${error.message}`);
    }
}