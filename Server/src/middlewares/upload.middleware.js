import multer from 'multer';
import ApiError from '../utils/ApiError.js';

// ─── Allowed MIME types ───────────────────────────────────────────────────────

// Profile images — used for user avatar uploads
const IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const IMAGE_MAX_BYTES = 2 * 1024 * 1024; // 2 MB

// Supporting documents — used for theatre owner registration docs
// Accepts images AND PDFs (most official documents are PDFs)
const DOCUMENT_MIME = new Set([
    'image/jpeg', 'image/png', 'image/webp',
    'application/pdf',
]);
const DOCUMENT_MAX_BYTES = 10 * 1024 * 1024; // 10 MB per doc

// ─── Storage — always in-memory, buffered for Cloudinary stream ───────────────

const memoryStorage = multer.memoryStorage();

// ─── Factory: build a multer instance for a given config ──────────────────────

const makeUploader = (allowedMime, maxBytes) =>
    multer({
        storage: memoryStorage,
        limits: { fileSize: maxBytes },
        fileFilter: (_req, file, cb) => {
            if (!allowedMime.has(file.mimetype)) {
                const allowed = [...allowedMime].join(', ');
                return cb(ApiError.badRequest(`Invalid file type. Allowed: ${allowed}`));
            }
            cb(null, true);
        },
    });

const imageUploader = makeUploader(IMAGE_MIME, IMAGE_MAX_BYTES);
const documentUploader = makeUploader(DOCUMENT_MIME, DOCUMENT_MAX_BYTES);

// ─── Wrap multer errors into ApiError ────────────────────────────────────────

const wrapMulter = (multerFn) => (req, res, next) => {
    multerFn(req, res, (err) => {
        if (!err) return next();
        if (err.code === 'LIMIT_FILE_SIZE') {
            return next(ApiError.badRequest(
                `File too large. Maximum allowed size is ${err.field === 'documents'
                    ? `${DOCUMENT_MAX_BYTES / 1024 / 1024}MB`
                    : `${IMAGE_MAX_BYTES / 1024 / 1024}MB`}`
            ));
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return next(ApiError.badRequest('Too many files uploaded'));
        }
        next(err instanceof ApiError ? err : ApiError.badRequest(err.message));
    });
};

// ─── Exported middleware ──────────────────────────────────────────────────────

/**
 * Single image upload (profile pictures, posters, etc.)
 * Field name: avatar
 * On success:  req.file = { buffer, mimetype, originalname, size }
 * On no file:  req.file = undefined  (file is optional)
 */
export const uploadSingle = (fieldName) =>
    wrapMulter(imageUploader.single(fieldName));

/**
 * Multiple supporting document upload for theatre owner registration.
 * Field name: documents (up to 10 files)
 * Accepts: JPEG, PNG, WebP, PDF (up to 10 MB each)
 * On success:  req.files = [{ buffer, mimetype, originalname, size }, ...]
 */
export const uploadDocuments = (maxCount = 10) =>
    wrapMulter(documentUploader.array('documents', maxCount));

/**
 * Single supporting document upload (add a document post-registration).
 * Field name: document
 */
export const uploadDocument = wrapMulter(documentUploader.single('document'));