import { Router } from 'express';
import { requireAuth, requireInstructor } from '../middleware/auth.middleware';
import { getCourseReviews, getMyReview, createReview, updateReview, upvoteReview, respondToReview } from '../controllers/review.controller';
const router = Router();
// Publicly readable endpoint (if desired, but auth is often passed anyway to check upvote status)
router.get('/courses/:courseId', getCourseReviews);
// Farmer authenticated endpoints
router.use(requireAuth);
router.get('/courses/:courseId/me', getMyReview);
router.post('/courses/:courseId', createReview);
router.put('/:reviewId', updateReview);
router.post('/:reviewId/upvote', upvoteReview);
// Instructor authenticated endpoints
router.post('/:reviewId/respond', requireInstructor, respondToReview);
export default router;
