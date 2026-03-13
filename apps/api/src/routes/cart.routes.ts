import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { validateCoupon } from '../controllers/payment.controller';

const router = Router();

router.post('/coupon', requireAuth, validateCoupon);

export default router;
