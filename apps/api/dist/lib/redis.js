import Redis from 'ioredis';
export const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
// BullMQ connection config (avoids ioredis version mismatch with bullmq's bundled ioredis)
export const bullmqConnection = {
    host: new URL(process.env.REDIS_URL || 'redis://localhost:6379').hostname,
    port: parseInt(new URL(process.env.REDIS_URL || 'redis://localhost:6379').port || '6379'),
};
