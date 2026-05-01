import { constructWebhookEvent } from './payment.service.js';
import { confirmBooking } from '../bookings/booking.service.js';
import env from '../../config/env.js';
import logger from '../../utils/logger.js';

/**
 * @swagger
 * /payments/webhook:
 *   post:
 *     summary: Stripe webhook endpoint
 *     description: |
 *       Receives and processes Stripe events. This endpoint uses **raw body** parsing
 *       (not JSON) so Stripe's signature verification works correctly.
 *
 *       **Do not call this directly** — it is invoked by Stripe's webhook system.
 *
 *       Handled events:
 *       | Event | Action |
 *       |-------|--------|
 *       | `payment_intent.succeeded` | Confirms booking, marks seats booked, awards loyalty points |
 *       | `payment_intent.payment_failed` | Logs failure; locks expire via cron |
 *
 *       Configure your Stripe webhook URL as: `https://your-domain.com/api/v1/payments/webhook`
 *     tags: [Payments]
 *     parameters:
 *       - in: header
 *         name: stripe-signature
 *         required: true
 *         schema: { type: string }
 *         description: Stripe webhook signature header for verification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Raw Stripe event payload
 *     responses:
 *       200:
 *         description: Event received and processed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 received: { type: boolean, example: true }
 *       400:
 *         description: Invalid Stripe signature
 */
export const handleWebhook = async (req, res) => {
  let event;
  try {
    event = constructWebhookEvent(req.body, req.headers['stripe-signature'], env.stripe.webhookSecret);
  } catch (err) {
    logger.warn(`Webhook verification failed: ${err.message}`);
    return res.status(400).send(err.message);
  }

  logger.info(`Stripe event: ${event.type}`);

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await confirmBooking(event.data.object.id);
        break;
      case 'payment_intent.payment_failed':
        logger.warn(`Payment failed: ${event.data.object.id}`);
        break;
      default:
        break;
    }
    res.json({ received: true });
  } catch (err) {
    logger.error(`Webhook handler error [${event.type}]:`, err);
    res.status(200).json({ received: true, error: err.message });
  }
};
