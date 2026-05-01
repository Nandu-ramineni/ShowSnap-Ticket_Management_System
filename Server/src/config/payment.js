import Stripe from 'stripe';
import env from './env.js';

const stripe = new Stripe(env.stripe.secretKey, {
  apiVersion: '2023-10-16',
  maxNetworkRetries: 3,
  timeout: 10000,
});

export default stripe;
