import { v2 as cloudinary } from 'cloudinary';
import env from './env.js';

cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
});

/**
 * Upload a file buffer to Cloudinary.
 *
 * @param {Buffer} buffer    - File buffer from multer memory storage
 * @param {object} options   - Cloudinary upload options
 * @returns {Promise<object>} Cloudinary upload result { secure_url, public_id, ... }
 */
export const uploadBuffer = (buffer, options = {}) =>
    new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
            if (error) return reject(error);
            resolve(result);
        });
        uploadStream.end(buffer);
    });

/**
 * Delete a resource from Cloudinary by public_id.
 * Silently no-ops if public_id is falsy — safe to call even when no old avatar exists.
 *
 * @param {string} publicId - Cloudinary public_id to delete
 */
export const deleteResource = async (publicId) => {
    if (!publicId) return;
    await cloudinary.uploader.destroy(publicId);
};

export default cloudinary;