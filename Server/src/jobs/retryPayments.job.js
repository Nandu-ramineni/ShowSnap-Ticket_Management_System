import cron from 'node-cron';
import { reconcilePendingBookings } from '../modules/bookings/booking.service.js';
import logger from '../utils/logger.js';

export const startRetryPaymentsJob = () => {
  cron.schedule('*/10 * * * *', async () => {
    try { await reconcilePendingBookings(); }
    catch (err) { logger.error('[Job] retryPayments failed:', err); }
  });
  logger.info('[Job] retryPayments scheduled (every 10 min)');
};
