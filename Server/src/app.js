import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import routes from './routes.js';
import { notFoundHandler, errorHandler } from './middlewares/error.middleware.js';
import { apiLimiter } from './middlewares/rateLimiter.middleware.js';
import { setupSwagger } from './config/swagger.js';
import env from './config/env.js';
import logger from './utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();
const app = express();

app.set('trust proxy', 1);

// ─── CORS ─────────────────────────────────────────────────────────────────────
/**
 * WHY NOT origin: '*' WITH credentials: true
 * ─────────────────────────────────────────
 * The Fetch spec (and every browser) forbids credentialed requests
 * (cookies, Authorization headers) when Access-Control-Allow-Origin is '*'.
 * The browser will hard-block the response even if the server sends it.
 *
 * The fix: always reflect an explicit allowlist, in dev AND prod.
 * ALLOWED_ORIGINS in .env is the single source of truth for both environments.
 *
 * .env:
 *   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
 */
const allowedOrigins = Array.isArray(env.ALLOWED_ORIGINS)
    ? env.ALLOWED_ORIGINS.map((o) => o.trim()).filter(Boolean)
    : typeof env.ALLOWED_ORIGINS === 'string'
        ? env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
        : [];

app.use(cors({
    origin: (requestOrigin, callback) => {
        // Allow non-browser callers (curl, Postman, server-to-server, Swagger)
        // that send no Origin header at all.
        if (!requestOrigin) return callback(null, true);

        if (allowedOrigins.includes(requestOrigin)) {
            return callback(null, true);
        }

        callback(new Error(`CORS: origin '${requestOrigin}' is not allowed`));
    },
    credentials   : true,    // allows the browser to send HttpOnly cookies
    methods        : ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders : ['Content-Type', 'Accept'],
    exposedHeaders : [],      // add any custom headers the client needs to read
    maxAge         : 86_400,  // preflight cache: 24 h — reduces OPTIONS round-trips
}));

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet({
    // Allow Swagger UI to load its inline scripts/styles in development
    contentSecurityPolicy: env.IS_PRODUCTION ? undefined : false,
}));

// ─── Logging ──────────────────────────────────────────────────────────────────
app.use(morgan(env.IS_PRODUCTION ? 'combined' : 'dev', {
    stream: { write: (msg) => logger.info(msg.trim()) },
}));

// ─── Body parsing ─────────────────────────────────────────────────────────────
// NOTE: Stripe webhook uses express.raw() — registered per-route in routes.js
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ─── Rate limiting ────────────────────────────────────────────────────────────
app.use('/api', apiLimiter);

// ─── Swagger UI ───────────────────────────────────────────────────────────────
// Available at: GET /api/v1/docs
// Raw spec at:  GET /api/v1/docs.json
setupSwagger(app);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/v1', routes);

// ─── Error handling ───────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;