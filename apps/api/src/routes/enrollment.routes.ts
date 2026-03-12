import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { getMyEnrollments, getEnrolledContent } from '../controllers/enrollment.controller';

const router = Router();

// Used by farmers to see what courses they own
router.use(requireAuth);
router.get('/', getMyEnrollments);
router.get('/:courseId/content', getEnrolledContent);

export default router;
