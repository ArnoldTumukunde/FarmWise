import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authLimiter, otpLimiter } from '../middleware/rate-limit.middleware';

const router = Router();

// /api/v1/auth/*
router.post('/register', authLimiter, AuthController.register);
router.post('/verify', otpLimiter, AuthController.verify);
router.post('/login', authLimiter, AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);
router.post('/forgot-password', authLimiter, AuthController.forgotPassword);
router.post('/reset-password', authLimiter, AuthController.resetPassword);

export default router;
