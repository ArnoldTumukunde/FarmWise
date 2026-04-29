import { Router, Response } from 'express';
import { requireAuth, requireInstructor, AuthRequest } from '../middleware/auth.middleware';
import { getUploadSignature, handleVideoReadyWebhook } from '../controllers/media.controller';
import { cloudinarySignatureLimiter } from '../middleware/rate-limit.middleware';
import { prisma } from '@farmwise/db';

const router = Router();

// /sign — avatar uploads open to all authenticated users; course media needs instructor
router.get('/sign', requireAuth, cloudinarySignatureLimiter, getUploadSignature);
router.post('/sign', requireAuth, cloudinarySignatureLimiter, getUploadSignature);

// Hash-based dedup lookup — returns existing publicId/duration if a lecture in the
// same Cloudinary account already has that hash. Lets the client skip re-upload.
router.post('/check-hash', requireAuth, requireInstructor, async (req: AuthRequest, res: Response) => {
  try {
    const { hash } = req.body || {};
    if (typeof hash !== 'string' || !/^[a-f0-9]{64}$/.test(hash)) {
      return res.status(400).json({ error: 'hash must be a 64-char SHA-256 hex string' });
    }
    const lecture = await prisma.lecture.findFirst({
      where: { videoHash: hash, videoPublicId: { not: null } },
      select: { videoPublicId: true, duration: true, hlsUrl: true, videoStatus: true },
    });
    res.json({ exists: !!lecture, ...(lecture || {}) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Webhooks must be public (Cloudinary calls them)
router.post('/video-ready', handleVideoReadyWebhook);

export default router;
