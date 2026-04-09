import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { getMyEnrollments, getEnrolledContent, requestRefund, enrollFree } from '../controllers/enrollment.controller';
const router = Router();
// Used by farmers to see what courses they own
router.use(requireAuth);
router.get('/', getMyEnrollments);
router.post('/enroll/:courseId', enrollFree);
router.get('/:courseId/content', getEnrolledContent);
router.post('/:courseId/refund', requestRefund);
export default router;
