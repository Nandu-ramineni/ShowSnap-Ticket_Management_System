import multer from 'multer';
import ApiError from '../utils/ApiError.js';

// ─── Allowed MIME types ───────────────────────────────────────────────────────

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

// ─── Storage ──────────────────────────────────────────────────────────────────
// Memory storage keeps the file in buffer — no temp files on disk.
// The buffer is passed directly to Cloudinary's upload stream.

const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
        return cb(ApiError.badRequest('Only JPEG, PNG, and WebP images are allowed'));
    }
    cb(null, true);
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_SIZE_BYTES },
});

// ─── Middleware factories ─────────────────────────────────────────────────────

/**
 * Single file upload middleware.
 * Usage: router.patch('/profile', authenticate, uploadSingle('avatar'), handler)
 *
 * On success:  req.file = { buffer, mimetype, originalname, size }
 * On no file:  req.file = undefined  (file is optional in profile update)
 * On error:    passes ApiError to next()
 */
export const uploadSingle = (fieldName) => (req, res, next) => {
    upload.single(fieldName)(req, res, (err) => {
        if (!err) return next();

        // Multer error: file too large
        if (err.code === 'LIMIT_FILE_SIZE') {
            return next(ApiError.badRequest(`File too large. Maximum size is ${MAX_SIZE_BYTES / 1024 / 1024}MB`));
        }
        // Any other multer or fileFilter error
        next(err instanceof ApiError ? err : ApiError.badRequest(err.message));
    });
};