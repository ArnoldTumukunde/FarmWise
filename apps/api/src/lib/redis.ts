import Redis from 'ioredis';

export const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
        const delay = Math.min(times * 200, 5000);
        return delay;
    },
});

redisClient.on('error', (err) => {
    console.error('Redis connection error:', err.message);
});

redisClient.on('connect', () => {
    console.log('Redis connected');
});

// BullMQ connection config (avoids ioredis version mismatch with bullmq's bundled ioredis)
export const bullmqConnection = {
  host: new URL(process.env.REDIS_URL || 'redis://localhost:6379').hostname,
  port: parseInt(new URL(process.env.REDIS_URL || 'redis://localhost:6379').port || '6379'),
};
