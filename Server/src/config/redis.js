import Redis from 'ioredis';
import env from './env.js';
import logger from '../utils/logger.js';

let client = null;

export const getRedisClient = () => {
  if (client) return client;

  client = new Redis({
    host: env.redis.host,
    port: env.redis.port,
    password: env.redis.password,
    retryStrategy: (times) => Math.min(times * 100, 3000),
    maxRetriesPerRequest: 3,
  });

  client.on('connect', () => logger.info('Redis connected'));
  client.on('error', (err) => logger.error('Redis error:', err));

  return client;
};

/** Acquire distributed lock: SET key value NX EX ttl */
export const acquireLock = async (key, value, ttl) => {
  const result = await getRedisClient().set(key, value, 'EX', ttl, 'NX');
  return result === 'OK';
};

/** Release lock only if we own it (atomic Lua) */
export const releaseLock = async (key, value) => {
  const lua = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else return 0 end
  `;
  const result = await getRedisClient().eval(lua, 1, key, value);
  return result === 1;
};

export const setCache = async (key, value, ttlSeconds = 300) => {
  await getRedisClient().set(key, JSON.stringify(value), 'EX', ttlSeconds);
};

export const getCache = async (key) => {
  const data = await getRedisClient().get(key);
  return data ? JSON.parse(data) : null;
};

export const deleteCache = async (...keys) => {
  if (keys.length) await getRedisClient().del(...keys);
};
