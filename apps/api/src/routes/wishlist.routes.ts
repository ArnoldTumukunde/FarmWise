import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { getWishlist, addToWishlist, removeFromWishlist } from '../controllers/wishlist.controller';

const router = Router();

router.use(requireAuth);
router.get('/', getWishlist);
router.post('/:courseId', addToWishlist);
router.delete('/:courseId', removeFromWishlist);

export default router;
