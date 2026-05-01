import app from './app.js';
import connectDB from './config/db.js';
import { getRedisClient } from './config/redis.js';
import { startClearExpiredLocksJob } from './jobs/clearExpiredLocks.job.js';
import { startRetryPaymentsJob } from './jobs/retryPayments.job.js';
import env from './config/env.js';
import logger from './utils/logger.js';

let server;

const start = async () => {
  await connectDB();
  getRedisClient(); // Establish connection

  startClearExpiredLocksJob();
  startRetryPaymentsJob();

  server = app.listen(env.PORT, () =>
    logger.info(`🎬 SeatSecure API v2 on port ${env.PORT} [${env.NODE_ENV}]`)
  );
};

const shutdown = async (signal) => {
  logger.info(`${signal} — graceful shutdown`);
  server?.close(async () => {
    const { default: mongoose } = await import('mongoose');
    await mongoose.connection.close();
    await getRedisClient().quit();
    logger.info('Connections closed. Exiting.');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 15000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('uncaughtException',  (err) => { logger.error('Uncaught:', err);    process.exit(1); });
process.on('unhandledRejection', (err) => { logger.error('Unhandled:', err);   process.exit(1); });

start().catch((err) => { logger.error('Startup failed:', err); process.exit(1); });
