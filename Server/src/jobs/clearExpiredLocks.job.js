import cron from 'node-cron';
import { clearExpiredLocks } from '../modules/seats/seat.service.js';
import logger from '../utils/logger.js';

export const startClearExpiredLocksJob = () => {
  cron.schedule('*/2 * * * *', async () => {
    try { await clearExpiredLocks(); }
    catch (err) { logger.error('[Job] clearExpiredLocks failed:', err); }
  });
  logger.info('[Job] clearExpiredLocks scheduled (every 2 min)');
};
