import { Router } from 'express';
import { body } from 'express-validator';
import * as theatreController from './theatre.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { ROLES } from '../../utils/constants.js';

const router = Router();

/**
 * @swagger
 * /theatres:
 *   get:
 *     summary: List theatres with optional filters
 *     tags: [Theatres]
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - in: query
 *         name: city
 *         schema: { type: string }
 *         example: Mumbai
 *       - in: query
 *         name: multiplex
 *         schema: { type: boolean }
 *         description: Filter multiplexes only
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by name or chain
 *         example: PVR
 *     responses:
 *       200:
 *         description: Paginated theatre list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:    { type: boolean, example: true }
 *                 data:       { type: array, items: { $ref: '#/components/schemas/Theatre' } }
 *                 pagination: { $ref: '#/components/schemas/PaginationMeta' }
 */
router.get('/', theatreController.listTheatres);

/**
 * @swagger
 * /theatres/nearby:
 *   get:
 *     summary: Find theatres near a geographic coordinate
 *     tags: [Theatres]
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema: { type: number }
 *         example: 18.9947
 *       - in: query
 *         name: lng
 *         required: true
 *         schema: { type: number }
 *         example: 72.8258
 *       - in: query
 *         name: radius
 *         schema: { type: number, default: 10 }
 *         description: Search radius in kilometres
 *     responses:
 *       200:
 *         description: Nearby theatres sorted by distance
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
 *                         theatres:
 *                           type: array
 *                           items: { $ref: '#/components/schemas/Theatre' }
 */
router.get('/nearby', theatreController.getNearbyTheatres);

/**
 * @swagger
 * /theatres/{id}:
 *   get:
 *     summary: Get theatre detail by ID
 *     tags: [Theatres]
 *     parameters:
 *       - $ref: '#/components/parameters/MongoIdPath'
 *     responses:
 *       200:
 *         description: Theatre detail
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
 *                         theatre: { $ref: '#/components/schemas/Theatre' }
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', theatreController.getTheatreById);

/**
 * @swagger
 * /theatres/{id}/screens:
 *   get:
 *     summary: Get all active screens for a theatre
 *     tags: [Theatres]
 *     parameters:
 *       - $ref: '#/components/parameters/MongoIdPath'
 *     responses:
 *       200:
 *         description: List of screens
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
 *                         screens:
 *                           type: array
 *                           items: { $ref: '#/components/schemas/Screen' }
 */
router.get('/:id/screens', theatreController.getTheatreScreens);

/**
 * @swagger
 * /theatres:
 *   post:
 *     summary: Create a new theatre (Admin or Theatre Owner)
 *     tags: [Theatres]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTheatreRequest'
 *     responses:
 *       201:
 *         description: Theatre created
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
 *                         theatre: { $ref: '#/components/schemas/Theatre' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/', authenticate, authorize(ROLES.ADMIN, ROLES.THEATRE_OWNER), [
  body('name').trim().notEmpty(),
  body('location.address').notEmpty(),
  body('location.city').notEmpty(),
  body('location.state').notEmpty(),
  body('location.pincode').notEmpty(),
], theatreController.createTheatre);

/**
 * @swagger
 * /theatres/{id}:
 *   put:
 *     summary: Update theatre (Admin or owner only)
 *     tags: [Theatres]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/MongoIdPath'
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTheatreRequest'
 *     responses:
 *       200:
 *         description: Theatre updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id', authenticate, authorize(ROLES.ADMIN, ROLES.THEATRE_OWNER), theatreController.updateTheatre);

export default router;
