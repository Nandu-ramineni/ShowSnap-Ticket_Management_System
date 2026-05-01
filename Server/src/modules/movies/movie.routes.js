import { Router } from 'express';
import { body } from 'express-validator';
import * as movieController from './movie.controller.js';
import { authenticate, isAdmin } from '../../middlewares/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * /movies:
 *   get:
 *     summary: List all active movies with filters
 *     tags: [Movies]
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - in: query
 *         name: city
 *         schema: { type: string }
 *         description: Filter movies showing in this city
 *         example: Mumbai
 *       - in: query
 *         name: date
 *         schema: { type: string, format: date }
 *         description: Filter movies showing on this date (YYYY-MM-DD)
 *         example: '2024-12-25'
 *       - in: query
 *         name: genre
 *         schema: { type: string }
 *         example: Sci-Fi
 *       - in: query
 *         name: language
 *         schema: { type: string }
 *         example: English
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Full-text search on title, description, tags
 *         example: interstellar
 *       - in: query
 *         name: featured
 *         schema: { type: boolean }
 *         description: Show only featured movies
 *     responses:
 *       200:
 *         description: Paginated movie list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:    { type: boolean, example: true }
 *                 data:       { type: array, items: { $ref: '#/components/schemas/Movie' } }
 *                 pagination: { $ref: '#/components/schemas/PaginationMeta' }
 */
router.get('/', movieController.listMovies);

/**
 * @swagger
 * /movies/{slug}:
 *   get:
 *     summary: Get movie detail by slug
 *     tags: [Movies]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *         example: interstellar-2
 *     responses:
 *       200:
 *         description: Movie detail
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
 *                         movie: { $ref: '#/components/schemas/Movie' }
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:slug', movieController.getMovieBySlug);

/**
 * @swagger
 * /movies/{id}/availability:
 *   get:
 *     summary: Get cities and dates where this movie is playing
 *     tags: [Movies]
 *     parameters:
 *       - $ref: '#/components/parameters/MongoIdPath'
 *     responses:
 *       200:
 *         description: Available cities and dates
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
 *                         cities:
 *                           type: array
 *                           items: { type: string }
 *                           example: [Mumbai, Delhi, Bangalore]
 *                         dates:
 *                           type: array
 *                           items: { type: string }
 *                           example: ['2024-12-25', '2024-12-26']
 */
router.get('/:id/availability', movieController.getMovieAvailability);

/**
 * @swagger
 * /movies:
 *   post:
 *     summary: Create a new movie (Admin only)
 *     tags: [Movies]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMovieRequest'
 *     responses:
 *       201:
 *         description: Movie created
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
 *                         movie: { $ref: '#/components/schemas/Movie' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/', authenticate, isAdmin, [
  body('title').trim().notEmpty(),
  body('duration').isInt({ min: 1 }),
  body('releaseDate').isISO8601(),
  body('language').notEmpty(),
], movieController.createMovie);

/**
 * @swagger
 * /movies/{id}:
 *   put:
 *     summary: Update movie details (Admin only)
 *     tags: [Movies]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/MongoIdPath'
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMovieRequest'
 *     responses:
 *       200:
 *         description: Movie updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     summary: Soft-delete a movie (Admin only)
 *     tags: [Movies]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/MongoIdPath'
 *     responses:
 *       204:
 *         description: Movie deleted
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id',    authenticate, isAdmin, movieController.updateMovie);
router.delete('/:id', authenticate, isAdmin, movieController.deleteMovie);

export default router;
