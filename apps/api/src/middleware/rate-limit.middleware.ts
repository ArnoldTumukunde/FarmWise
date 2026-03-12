import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import Redis from 'ioredis';
import { Request } from 'express';
import { AuthRequest } from './auth.middleware';

const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.call(...args) as any,
    prefix: 'rl:auth:',
  }),
  message: { error: 'Too many requests, please try again later.' },
});

export const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.call(...args) as any,
    prefix: 'rl:otp:',
  }),
  keyGenerator: (req: Request) => req.body.phone || req.ip || 'unknown',
  message: { error: 'Too many OTP attempts, please try again in 10 minutes.' },
});

export const downloadUrlLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.call(...args) as any,
    prefix: 'rl:download:',
  }),
  keyGenerator: (req: AuthRequest) => req.user?.id || req.ip || 'unknown',
  message: { error: 'Hourly download URL generation limit reached.' },
});

export const cloudinarySignatureLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.call(...args) as any,
    prefix: 'rl:signature:',
  }),
  keyGenerator: (req: AuthRequest) => req.user?.id || req.ip || 'unknown',
  message: { error: 'Hourly Cloudinary signature limit reached.' },
});
