import { Router } from 'express';
import { body } from 'express-validator';
import * as showtimeController from './showtime.controller.js';
import { authenticate, isAdmin } from '../../middlewares/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * /showtimes/movie/{movieId}:
 *   get:
 *     summary: Get showtimes for a movie on a date in a city, grouped by theatre
 *     description: |
 *       Returns shows grouped by theatre — the primary browse endpoint.
 *       Both `city` and `date` are required.
 *     tags: [Showtimes]
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/MongoId'
 *       - in: query
 *         name: city
 *         required: true
 *         schema: { type: string }
 *         example: Mumbai
 *       - in: query
 *         name: date
 *         required: true
 *         schema: { type: string, format: date }
 *         example: '2024-12-25'
 *     responses:
 *       200:
 *         description: Shows grouped by theatre
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ShowtimesGroupedResponse'
 *       400:
 *         description: city and date params are required
 */
router.get('/movie/:movieId', showtimeController.getShowtimesForMovie);

/**
 * @swagger
 * /showtimes/{id}:
 *   get:
 *     summary: Get showtime detail (includes movie, theatre, screen info)
 *     tags: [Showtimes]
 *     parameters:
 *       - $ref: '#/components/parameters/MongoIdPath'
 *     responses:
 *       200:
 *         description: Showtime detail with populated references
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
 *                         showtime: { $ref: '#/components/schemas/Showtime' }
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', showtimeController.getShowtimeById);

/**
 * @swagger
 * /showtimes:
 *   post:
 *     summary: Schedule a new showtime (Admin only)
 *     description: |
 *       Creates a showtime AND auto-generates individual Seat documents from the screen's seatLayout.
 *       Validates that no overlapping show exists on the same screen.
 *     tags: [Showtimes]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateShowtimeRequest'
 *     responses:
 *       201:
 *         description: Showtime created and seats generated
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
 *                         showtime: { $ref: '#/components/schemas/Showtime' }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       409:
 *         description: Overlapping show already scheduled on this screen
 */
router.post('/', authenticate, isAdmin, [
  body('movie').isMongoId(),
  body('theatre').isMongoId(),
  body('screen').isMongoId(),
  body('startTime').isISO8601(),
  body('language').notEmpty(),
], showtimeController.createShowtime);

/**
 * @swagger
 * /showtimes/{id}/cancel:
 *   patch:
 *     summary: Cancel a scheduled showtime (Admin only)
 *     tags: [Showtimes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/MongoIdPath'
 *     responses:
 *       200:
 *         description: Showtime cancelled
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch('/:id/cancel', authenticate, isAdmin, showtimeController.cancelShowtime);

export default router;
