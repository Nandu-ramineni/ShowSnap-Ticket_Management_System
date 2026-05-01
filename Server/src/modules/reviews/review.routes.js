import { Router } from 'express';
import { body } from 'express-validator';
import * as reviewController from './review.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router({ mergeParams: true });

/**
 * @swagger
 * /movies/{movieId}/reviews:
 *   get:
 *     summary: Get verified reviews for a movie
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/MongoId'
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: Paginated reviews (newest first)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:    { type: boolean, example: true }
 *                 data:       { type: array, items: { $ref: '#/components/schemas/Review' } }
 *                 pagination: { $ref: '#/components/schemas/PaginationMeta' }
 *   post:
 *     summary: Submit a verified movie review (must have confirmed booking)
 *     description: |
 *       A user can only review a movie after having a **confirmed booking** for it.
 *       One review per user per movie. Submitting triggers automatic movie rating recalculation.
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/MongoId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReviewRequest'
 *     responses:
 *       201:
 *         description: Review submitted
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
 *                         review: { $ref: '#/components/schemas/Review' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: No confirmed booking found for this movie
 *       409:
 *         description: You have already reviewed this movie
 */
router.get('/',  reviewController.getMovieReviews);
router.post('/', authenticate, [
  body('bookingId').isMongoId(),
  body('rating').isInt({ min: 1, max: 5 }),
  body('body').optional().isLength({ max: 2000 }),
], reviewController.createReview);

/**
 * @swagger
 * /movies/{movieId}/reviews/{id}:
 *   delete:
 *     summary: Delete a review (own review or Admin)
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/MongoId'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/MongoId'
 *     responses:
 *       204:
 *         description: Review deleted
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', authenticate, reviewController.deleteReview);

export default router;
