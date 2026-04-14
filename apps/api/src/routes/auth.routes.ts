import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authLimiter, otpLimiter } from '../middleware/rate-limit.middleware';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// /api/v1/auth/*
router.get('/me', requireAuth, AuthController.me);
router.post('/register', authLimiter, AuthController.register);
router.post('/verify', otpLimiter, AuthController.verify);
router.post('/login', authLimiter, AuthController.login);
router.post('/refresh', authLimiter, AuthController.refresh);
router.post('/logout', AuthController.logout);
router.post('/forgot-password', authLimiter, AuthController.forgotPassword);
router.post('/reset-password', authLimiter, AuthController.resetPassword);
router.post('/resend-otp', otpLimiter, AuthController.resendOtp);
router.post('/resend-verification', otpLimiter, AuthController.resendVerification);

export default router;
