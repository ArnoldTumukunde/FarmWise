import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { getDownloadUrl, getPdfUrl, recordDownload, recordDownloadDeletion, syncProgress } from '../controllers/learn.controller';
import { downloadUrlLimiter } from '../middleware/rate-limit.middleware';

const router = Router();

// Apply auth to all learn routes automatically
router.use(requireAuth);

router.post('/lectures/:lectureId/download-url', downloadUrlLimiter, getDownloadUrl);
router.get('/lectures/:lectureId/pdf-url', downloadUrlLimiter, getPdfUrl);
router.post('/downloads', recordDownload);
router.delete('/downloads/:lectureId', recordDownloadDeletion);
router.post('/progress/sync', syncProgress);

export default router;
