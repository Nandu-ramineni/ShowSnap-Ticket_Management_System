import { Router } from 'express';
import { body } from 'express-validator';
import * as bookingController from './booking.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { bookingLimiter } from '../../middlewares/rateLimiter.middleware.js';

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /bookings:
 *   post:
 *     summary: Initiate a booking and get Stripe clientSecret
 *     description: |
 *       Validates that requested seats are locked by the user, calculates pricing
 *       (subtotal + 2% convenience fee + 18% GST), creates a Stripe PaymentIntent,
 *       and returns the `clientSecret` for frontend payment confirmation.
 *
 *       **After this call:** pass `clientSecret` to `stripe.confirmPayment()` on the frontend.
 *       Booking is confirmed via the Stripe webhook automatically.
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InitiateBookingRequest'
 *     responses:
 *       201:
 *         description: Booking initiated — complete payment to confirm
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/InitiateBookingResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       409:
 *         description: Seat lock expired — user must lock seats again
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.post('/', bookingLimiter, [
  body('showtimeId').isMongoId(),
  body('seatIds').isArray({ min: 1 }),
], bookingController.initiateBooking);

/**
 * @swagger
 * /bookings/my:
 *   get:
 *     summary: Get current user's booking history
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: Paginated booking list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:    { type: boolean, example: true }
 *                 data:       { type: array, items: { $ref: '#/components/schemas/Booking' } }
 *                 pagination: { $ref: '#/components/schemas/PaginationMeta' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/my', bookingController.getMyBookings);

/**
 * @swagger
 * /bookings/{id}:
 *   get:
 *     summary: Get full booking detail (ticket view)
 *     description: Returns the complete booking with seat snapshot, payment details, and meta — use this to render the digital ticket.
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/MongoIdPath'
 *     responses:
 *       200:
 *         description: Full booking detail
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         booking: { $ref: '#/components/schemas/Booking' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', bookingController.getBookingById);

/**
 * @swagger
 * /bookings/{id}/cancel:
 *   post:
 *     summary: Cancel a confirmed booking and trigger automatic Stripe refund
 *     description: |
 *       Checks the theatre's cancellation policy (cutoff hours + refund percentage).
 *       If eligible, issues a Stripe refund and releases seats back to available.
 *       Loyalty points earned are reversed.
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/MongoIdPath'
 *     responses:
 *       200:
 *         description: Booking cancelled and refund initiated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         booking:      { $ref: '#/components/schemas/Booking' }
 *                         refundAmount: { type: integer, example: 96288, description: 'Refunded amount in paise' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Cancellation not allowed (too close to showtime or theatre policy)
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: Booking is not in a cancellable state
 */
router.post('/:id/cancel', bookingController.cancelBooking);

export default router;
