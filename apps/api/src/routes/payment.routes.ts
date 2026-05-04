import express, { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware';
import {
  createCheckoutSession,
  ipnGet,
  ipnPost,
  getPaymentStatus,
  adminRefund,
} from '../controllers/payment.controller';

const router = Router();

// Initiate Pesapal checkout (single course or cart). Returns { redirectUrl }.
router.post('/checkout', requireAuth, createCheckoutSession);

// Pesapal IPN — public. Pesapal calls with GET or POST depending on how the IPN
// URL was registered. Both supported. No signature; we re-verify status by
// calling GetTransactionStatus with our bearer token.
router.get('/ipn', ipnGet);
router.post('/ipn', express.json(), ipnPost);

// Frontend polls this from /payments/return while the user waits for IPN to
// land (Pesapal redirects browser before triggering IPN sometimes).
router.get('/status/:orderTrackingId', requireAuth, getPaymentStatus);

// Admin-only manual refund.
router.post('/:id/refund', requireAuth, requireAdmin, adminRefund);

export default router;
