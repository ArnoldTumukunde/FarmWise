"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudinarySignatureLimiter = exports.downloadUrlLimiter = exports.otpLimiter = exports.authLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const rate_limit_redis_1 = require("rate-limit-redis");
const redis_1 = require("../lib/redis");
const validate = { default: false };
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    store: new rate_limit_redis_1.RedisStore({
        sendCommand: ((...args) => redis_1.redisClient.call(args[0], ...args.slice(1))),
        prefix: 'rl:auth:',
    }),
    message: { error: 'Too many requests, please try again later.' },
    validate,
});
exports.otpLimiter = (0, express_rate_limit_1.default)({
    windowMs: 10 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    store: new rate_limit_redis_1.RedisStore({
        sendCommand: ((...args) => redis_1.redisClient.call(args[0], ...args.slice(1))),
        prefix: 'rl:otp:',
    }),
    keyGenerator: (req) => req.body.phone || req.ip || 'unknown',
    message: { error: 'Too many OTP attempts, please try again in 10 minutes.' },
    validate,
});
exports.downloadUrlLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    store: new rate_limit_redis_1.RedisStore({
        sendCommand: ((...args) => redis_1.redisClient.call(args[0], ...args.slice(1))),
        prefix: 'rl:download:',
    }),
    keyGenerator: (req) => req.user?.id || req.ip || 'unknown',
    message: { error: 'Hourly download URL generation limit reached.' },
    validate,
});
exports.cloudinarySignatureLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    store: new rate_limit_redis_1.RedisStore({
        sendCommand: ((...args) => redis_1.redisClient.call(args[0], ...args.slice(1))),
        prefix: 'rl:signature:',
    }),
    keyGenerator: (req) => req.user?.id || req.ip || 'unknown',
    message: { error: 'Hourly Cloudinary signature limit reached.' },
    validate,
});
