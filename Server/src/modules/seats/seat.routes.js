import { Router } from 'express';
import * as seatController from './seat.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { bookingLimiter } from '../../middlewares/rateLimiter.middleware.js';

const router = Router({ mergeParams: true });

/**
 * @swagger
 * /showtimes/{showtimeId}/seats:
 *   get:
 *     summary: Get live seat map for a showtime
 *     description: Returns all seats with their current status (available / locked / booked / blocked), grouped by row.
 *     tags: [Seats]
 *     parameters:
 *       - in: path
 *         name: showtimeId
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/MongoId'
 *     responses:
 *       200:
 *         description: Seat map grouped by row
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/SeatMapResponse'
 */
router.get('/', seatController.getSeatMap);

/**
 * @swagger
 * /showtimes/{showtimeId}/seats/lock:
 *   post:
 *     summary: Lock seats for a showtime (authenticated)
 *     description: |
 *       Atomically locks up to 8 seats using Redis `SET NX EX` + MongoDB.
 *       Locks expire after **10 minutes** (configurable via `SEAT_LOCK_TTL`).
 *       Returns a `lockValue` and `clientSecret` flow starts from `POST /bookings`.
 *
 *       **Race condition handling:** If two users try to lock the same seat simultaneously,
 *       only one succeeds — the other receives a 409 Conflict with the specific seat label.
 *     tags: [Seats]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: showtimeId
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/MongoId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LockSeatsRequest'
 *     responses:
 *       200:
 *         description: Seats locked successfully. Proceed to POST /bookings.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/LockSeatsResponse'
 *       400:
 *         description: No seats provided or exceeds 8-seat limit
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       409:
 *         description: One or more seats are not available (just taken)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               statusCode: 409
 *               message: Seat D7 was just taken. Please choose another.
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.post('/lock', authenticate, bookingLimiter, seatController.lockSeats);

/**
 * @swagger
 * /showtimes/{showtimeId}/seats/release:
 *   post:
 *     summary: Manually release seat locks (authenticated)
 *     description: |
 *       Called when a user navigates back from the checkout page.
 *       Only releases seats locked by the requesting user.
 *       Locks also auto-expire via TTL — this endpoint is for immediate UX feedback.
 *     tags: [Seats]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: showtimeId
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/MongoId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [seatIds]
 *             properties:
 *               seatIds:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/MongoId'
 *     responses:
 *       200:
 *         description: Seats released and available again
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/release', authenticate, seatController.releaseSeats);

export default router;
