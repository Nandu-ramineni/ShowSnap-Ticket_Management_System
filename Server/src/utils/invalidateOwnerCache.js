import { deleteCache } from "../config/redis.js";


export const invalidateOwnerCache = async(ownerId) => {
    await deleteCache(
        `theatreOwner:profile:${ownerId}`
    );
}