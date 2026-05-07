import { Router } from 'express';
import express from 'express';

import authRoutes      from './modules/auth/auth.routes.js';
import theatreOwnerRoutes from './modules/auth/theatreOwner.routes.js';
import movieRoutes     from './modules/movies/movie.routes.js';
import theatreRoutes   from './modules/theatres/theatre.routes.js';
import screenRoutes    from './modules/screens/screen.routes.js';
import showtimeRoutes  from './modules/showtimes/showtime.routes.js';
import seatRoutes      from './modules/seats/seat.routes.js';
import bookingRoutes   from './modules/bookings/booking.routes.js';
import reviewRoutes    from './modules/reviews/review.routes.js';
import adminRoutes     from './modules/auth/admin.routes.js';
import { handleWebhook } from './modules/payments/payment.webhook.js';

const router = Router();

// ─── Stripe webhook — raw body BEFORE express.json ──────────
router.post('/payments/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// ─── Auth ────────────────────────────────────────────────────
router.use('/auth', authRoutes);
router.use('/theatre-owner', theatreOwnerRoutes);
router.use('/admin', adminRoutes);
// ─── Movies + nested resources ───────────────────────────────
router.use('/movies', movieRoutes);
router.use('/movies/:movieId/reviews',   reviewRoutes);
router.use('/movies/:movieId/showtimes', showtimeRoutes);

// ─── Theatres + Screens ──────────────────────────────────────
router.use('/theatres',                    theatreRoutes);
router.use('/theatres/:theatreId/screens', screenRoutes);
router.use('/screens',                     screenRoutes);

// ─── Showtimes + Seats ───────────────────────────────────────
router.use('/showtimes',                   showtimeRoutes);
router.use('/showtimes/:showtimeId/seats', seatRoutes);

// ─── Bookings ────────────────────────────────────────────────
router.use('/bookings', bookingRoutes);

/**
 * @swagger
 * /health:
 *   get:
 *     summary: API health check
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:    { type: string, example: ok }
 *                 timestamp: { type: string, format: date-time }
 *                 version:   { type: string, example: '2.0.0' }
 */
router.get('/health', (req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '2.0.0' })
);

export default router;
