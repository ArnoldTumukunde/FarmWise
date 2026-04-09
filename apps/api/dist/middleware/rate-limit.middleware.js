import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redisClient } from '../lib/redis';
const validate = { default: false };
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
        sendCommand: ((...args) => redisClient.call(args[0], ...args.slice(1))),
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
        sendCommand: ((...args) => redisClient.call(args[0], ...args.slice(1))),
        prefix: 'rl:otp:',
    }),
    keyGenerator: (req) => req.body.phone || req.ip || 'unknown',
    message: { error: 'Too many OTP attempts, please try again in 10 minutes.' },
    validate,
});
export const downloadUrlLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
        sendCommand: ((...args) => redisClient.call(args[0], ...args.slice(1))),
        prefix: 'rl:download:',
    }),
    keyGenerator: (req) => req.user?.id || req.ip || 'unknown',
    message: { error: 'Hourly download URL generation limit reached.' },
    validate,
});
export const cloudinarySignatureLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
        sendCommand: ((...args) => redisClient.call(args[0], ...args.slice(1))),
        prefix: 'rl:signature:',
    }),
    keyGenerator: (req) => req.user?.id || req.ip || 'unknown',
    message: { error: 'Hourly Cloudinary signature limit reached.' },
    validate,
});
