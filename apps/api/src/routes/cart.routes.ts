import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { validateCoupon } from '../controllers/payment.controller';
import { getCart, addToCart, removeFromCart } from '../controllers/cart.controller';

const router = Router();

router.use(requireAuth);
router.get('/', getCart);
router.post('/', addToCart);
router.delete('/:itemId', removeFromCart);
router.post('/coupon', validateCoupon);

export default router;
