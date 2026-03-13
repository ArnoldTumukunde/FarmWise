import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { Request } from 'express';
import { AuthRequest } from './auth.middleware';
import { redisClient } from '../lib/redis';

const validate = { default: false } as const;

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: ((...args: string[]) => redisClient.call(args[0], ...args.slice(1))) as any,
    prefix: 'rl:auth:',
  }),
  message: { error: 'Too many requests, please try again later.' },
  validate,
});

export const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: ((...args: string[]) => redisClient.call(args[0], ...args.slice(1))) as any,
    prefix: 'rl:otp:',
  }),
  keyGenerator: (req: Request) => req.body.phone || req.ip || 'unknown',
  message: { error: 'Too many OTP attempts, please try again in 10 minutes.' },
  validate,
});

export const downloadUrlLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: ((...args: string[]) => redisClient.call(args[0], ...args.slice(1))) as any,
    prefix: 'rl:download:',
  }),
  keyGenerator: (req: AuthRequest) => req.user?.id || req.ip || 'unknown',
  message: { error: 'Hourly download URL generation limit reached.' },
  validate,
});

export const cloudinarySignatureLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: ((...args: string[]) => redisClient.call(args[0], ...args.slice(1))) as any,
    prefix: 'rl:signature:',
  }),
  keyGenerator: (req: AuthRequest) => req.user?.id || req.ip || 'unknown',
  message: { error: 'Hourly Cloudinary signature limit reached.' },
  validate,
});
