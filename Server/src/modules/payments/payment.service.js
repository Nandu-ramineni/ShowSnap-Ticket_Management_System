import stripe from '../../config/payment.js';
import ApiError from '../../utils/ApiError.js';
import logger from '../../utils/logger.js';

const toCents = (amount) => Math.round(amount * 100);

export const createPaymentIntent = async (amount, currency = 'inr', metadata = {}) => {
  try {
    const intent = await stripe.paymentIntents.create({
      amount:   toCents(amount),
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: { ...metadata, source: 'seatsecure' },
    });
    return { paymentIntentId: intent.id, clientSecret: intent.client_secret };
  } catch (err) {
    logger.error('Stripe createPaymentIntent error:', err);
    throw ApiError.internal('Payment initialization failed');
  }
};

export const retrievePaymentIntent = async (id) => {
  try {
    return await stripe.paymentIntents.retrieve(id);
  } catch (err) {
    logger.error('Stripe retrieve error:', err);
    throw ApiError.internal('Could not retrieve payment');
  }
};

export const createRefund = async (paymentIntentId, amountInRupees = null) => {
  try {
    const params = { payment_intent: paymentIntentId };
    if (amountInRupees) params.amount = toCents(amountInRupees);
    return await stripe.refunds.create(params);
  } catch (err) {
    logger.error('Stripe refund error:', err);
    throw ApiError.internal('Refund processing failed');
  }
};

export const constructWebhookEvent = (rawBody, sig, secret) => {
  try {
    return stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    throw ApiError.badRequest(`Webhook signature failed: ${err.message}`);
  }
};
