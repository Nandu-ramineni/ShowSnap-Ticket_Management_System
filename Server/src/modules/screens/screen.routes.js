import { Router } from 'express';
import * as screenController from './screen.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { ROLES } from '../../utils/constants.js';

const router = Router({ mergeParams: true });

/**
 * @swagger
 * /screens/{id}:
 *   get:
 *     summary: Get screen detail by ID
 *     tags: [Screens]
 *     parameters:
 *       - $ref: '#/components/parameters/MongoIdPath'
 *     responses:
 *       200:
 *         description: Screen detail
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
 *                         screen: { $ref: '#/components/schemas/Screen' }
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', screenController.getScreenById);

/**
 * @swagger
 * /screens/{id}/seat-layout:
 *   get:
 *     summary: Get screen seat layout template grouped by row
 *     description: Returns the static seat layout template for a screen. For live show seat statuses, use the Seats API.
 *     tags: [Screens]
 *     parameters:
 *       - $ref: '#/components/parameters/MongoIdPath'
 *     responses:
 *       200:
 *         description: Seat layout grouped by row
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/SeatLayoutResponse'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id/seat-layout', screenController.getSeatLayout);

/**
 * @swagger
 * /theatres/{theatreId}/screens:
 *   post:
 *     summary: Create a screen inside a theatre (Admin or Theatre Owner)
 *     tags: [Screens]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: theatreId
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/MongoId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateScreenRequest'
 *           example:
 *             name: Screen 1 — IMAX
 *             screenType: IMAX
 *             soundSystem: Dolby Atmos
 *             projectionType: IMAX Laser 4K
 *             pricing:
 *               recliner: 60000
 *               premium: 45000
 *               gold: 35000
 *               silver: 25000
 *             seatLayout:
 *               - { row: A, number: 1, label: A1, type: recliner, isBlocked: false, x: 0, y: 0 }
 *               - { row: A, number: 2, label: A2, type: recliner, isBlocked: false, x: 1, y: 0 }
 *     responses:
 *       201:
 *         description: Screen created and totalScreens incremented on the theatre
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
 *                         screen: { $ref: '#/components/schemas/Screen' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/', authenticate, authorize(ROLES.ADMIN, ROLES.THEATRE_OWNER), screenController.createScreen);

/**
 * @swagger
 * /screens/{id}:
 *   put:
 *     summary: Update a screen (Admin or Theatre Owner)
 *     tags: [Screens]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/MongoIdPath'
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateScreenRequest'
 *     responses:
 *       200:
 *         description: Screen updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     summary: Deactivate a screen (Admin or Theatre Owner)
 *     tags: [Screens]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/MongoIdPath'
 *     responses:
 *       204:
 *         description: Screen deactivated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id',    authenticate, authorize(ROLES.ADMIN, ROLES.THEATRE_OWNER), screenController.updateScreen);
router.delete('/:id', authenticate, authorize(ROLES.ADMIN, ROLES.THEATRE_OWNER), screenController.deleteScreen);

export default router;
