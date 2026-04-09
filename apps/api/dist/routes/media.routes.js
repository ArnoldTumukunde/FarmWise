import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { getUploadSignature, handleVideoReadyWebhook } from '../controllers/media.controller';
import { cloudinarySignatureLimiter } from '../middleware/rate-limit.middleware';
const router = Router();
// /sign — avatar uploads open to all authenticated users; course media needs instructor
router.get('/sign', requireAuth, cloudinarySignatureLimiter, getUploadSignature);
router.post('/sign', requireAuth, cloudinarySignatureLimiter, getUploadSignature);
// Webhooks must be public (Cloudinary calls them)
router.post('/video-ready', handleVideoReadyWebhook);
export default router;
