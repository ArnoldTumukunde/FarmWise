import { Router } from 'express';
import { requireAuth, requireInstructor } from '../middleware/auth.middleware';
import { getUploadSignature, handleVideoReadyWebhook } from '../controllers/media.controller';
import { cloudinarySignatureLimiter } from '../middleware/rate-limit.middleware';

const router = Router();

// /sign needs instructor
router.post('/sign', requireAuth, requireInstructor, cloudinarySignatureLimiter, getUploadSignature);

// Webhooks must be public (Cloudinary calls them)
router.post('/video-ready', handleVideoReadyWebhook);

export default router;
