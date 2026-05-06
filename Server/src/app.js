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
app.use(cors({
    origin: ["http://localhost:5173"],
    credentials: true,
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