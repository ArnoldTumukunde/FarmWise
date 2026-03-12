import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.middleware';
import { 
    getDashboard, getUsers, getApplications, reviewApplication,
    getCoursesForReview, moderateCourse, toggleFeatured,
    getFlaggedReviews, moderateReview 
} from '../controllers/admin.controller';

const router = Router();
router.use(requireAdmin);

// Dashboard
router.get('/dashboard', getDashboard);

// Users & Applications
router.get('/users', getUsers);
router.get('/applications', getApplications);
router.post('/applications/:id/review', reviewApplication);

// Courses
router.get('/courses/review', getCoursesForReview);
router.post('/courses/:id/moderate', moderateCourse);
router.post('/courses/:id/featured', toggleFeatured);

// Reviews
router.get('/reviews/flagged', getFlaggedReviews);
router.post('/reviews/:id/moderate', moderateReview);

export default router;
