import { Router } from 'express';
import { body, param } from 'express-validator';
import * as screenController from './screen.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../utils/validate.js';
import { ROLES, SCREEN_TYPES, SEAT_TYPES } from '../../utils/constants.js';

const router = Router();

// Create is mounted ONLY at /theatres/:theatreId/screens (mergeParams: true so
// req.params.theatreId is visible to the controller). It used to also be
// reachable via the flat /screens mount below, with no theatreId in params at
// all — that silent gap was the actual root cause of the "theatre_id missing
// on screen creation" bug. Splitting create into its own router removes the
// bypass instead of just fixing the symptom at the controller.
const createRouter = Router({ mergeParams: true });

// ─── Validators ───────────────────────────────────────────────────────────────────

const v = {
  name: body('name')
    .trim()
    .notEmpty().withMessage('Screen name is required')
    .isLength({ max: 150 }).withMessage('Screen name must be 150 chars or fewer'),

  screenType: body('screenType')
    .isIn(Object.values(SCREEN_TYPES))
    .withMessage(`Screen type must be one of: ${Object.values(SCREEN_TYPES).join(', ')}`),

  pricing: body('pricing')
    .optional()
    .custom((val) => {
      if (!val || typeof val !== 'object') return true;
      for (const [type, price] of Object.entries(val)) {
        if (typeof price !== 'number' || price < 0) {
          throw new Error(`Pricing for ${type} must be a non-negative number`);
        }
      }
      return true;
    }),

  seatLayout: body('seatLayout')
    .isArray({ min: 1 }).withMessage('Seat layout must have at least one seat')
    .custom((seats) => {
      const labels = new Set();
      for (const seat of seats) {
        if (!seat.row || !seat.number || !seat.label) {
          throw new Error('Each seat must have row, number, and label');
        }
        if (!/^[A-Z]$/.test(seat.row)) {
          throw new Error(`Seat row must be A-Z, got: ${seat.row}`);
        }
        if (!Number.isInteger(seat.number) || seat.number < 1) {
          throw new Error(`Seat number must be a positive integer, got: ${seat.number}`);
        }
        if (labels.has(seat.label)) {
          throw new Error(`Duplicate seat label: ${seat.label}`);
        }
        labels.add(seat.label);
        if (!Object.values(SEAT_TYPES).includes(seat.type)) {
          throw new Error(`Invalid seat type: ${seat.type}`);
        }
      }
      return true;
    }),

  screenId: param('id')
    .isMongoId().withMessage('Valid screen ID required'),
};


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
createRouter.post('/',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.THEATRE_OWNER),
  v.name,
  v.screenType,
  v.pricing,
  v.seatLayout,
  validate,
  screenController.createScreen
);

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
router.put('/:id',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.THEATRE_OWNER),
  v.screenId,
  v.name,
  v.screenType,
  v.pricing,
  v.seatLayout,
  validate,
  screenController.updateScreen
);

router.delete('/:id',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.THEATRE_OWNER),
  v.screenId,
  validate,
  screenController.deleteScreen
);

export { createRouter as screenCreateRoutes };
export default router;
