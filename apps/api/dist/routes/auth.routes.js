"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const rate_limit_middleware_1 = require("../middleware/rate-limit.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// /api/v1/auth/*
router.get('/me', auth_middleware_1.requireAuth, auth_controller_1.AuthController.me);
router.post('/register', rate_limit_middleware_1.authLimiter, auth_controller_1.AuthController.register);
router.post('/verify', rate_limit_middleware_1.otpLimiter, auth_controller_1.AuthController.verify);
router.post('/login', rate_limit_middleware_1.authLimiter, auth_controller_1.AuthController.login);
router.post('/refresh', auth_controller_1.AuthController.refresh);
router.post('/logout', auth_controller_1.AuthController.logout);
router.post('/forgot-password', rate_limit_middleware_1.authLimiter, auth_controller_1.AuthController.forgotPassword);
router.post('/reset-password', rate_limit_middleware_1.authLimiter, auth_controller_1.AuthController.resetPassword);
router.post('/resend-otp', rate_limit_middleware_1.otpLimiter, auth_controller_1.AuthController.resendOtp);
router.post('/resend-verification', rate_limit_middleware_1.otpLimiter, auth_controller_1.AuthController.resendVerification);
exports.default = router;
