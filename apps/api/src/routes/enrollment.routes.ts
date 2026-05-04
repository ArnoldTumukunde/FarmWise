import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import {
  getMyEnrollments,
  getEnrolledContent,
  requestRefund,
  enrollFree,
  archiveEnrollment,
  unarchiveEnrollment,
} from '../controllers/enrollment.controller';

const router = Router();

// Used by farmers to see what courses they own
router.use(requireAuth);
router.get('/', getMyEnrollments);
router.post('/enroll/:courseId', enrollFree);
router.get('/:courseId/content', getEnrolledContent);
router.post('/:courseId/refund', requestRefund);
// Archive (hide from My Learning + pause progress sync). :id may be enrollment id or course id.
router.post('/:id/archive', archiveEnrollment);
router.post('/:id/unarchive', unarchiveEnrollment);

export default router;
