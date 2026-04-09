import express, { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { createCheckoutSession, handleStripeWebhook } from '../controllers/payment.controller';
const router = Router();
// Used by frontend to trigger a purchase or fast-track a free enrollment
router.post('/checkout', requireAuth, createCheckoutSession);
// Stripe webhook hit from Stripe's servers
// Extremely important: This needs raw body parsing
router.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);
export default router;
