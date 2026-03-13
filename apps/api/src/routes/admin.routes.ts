import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware';
import {
    getDashboard, getUsers, getApplications, reviewApplication,
    updateUserRole, suspendUser, deleteUser,
    listAllCourses, getCoursesForReview, moderateCourse, toggleFeatured,
    deleteCourse, unpublishCourse,
    getFlaggedReviews, moderateReview, deleteReview
} from '../controllers/admin.controller';

const router = Router();
router.use(requireAuth, requireAdmin);

// Dashboard
router.get('/dashboard', getDashboard);

// Users & Applications
router.get('/users', getUsers);
router.post('/users/:id/role', updateUserRole);
router.post('/users/:id/suspend', suspendUser);
router.delete('/users/:id', deleteUser);
router.get('/applications', getApplications);
router.post('/applications/:id/review', reviewApplication);

// Courses
router.get('/courses', listAllCourses);
router.get('/courses/review', getCoursesForReview);
router.post('/courses/:id/moderate', moderateCourse);
router.post('/courses/:id/featured', toggleFeatured);
router.post('/courses/:id/unpublish', unpublishCourse);
router.delete('/courses/:id', deleteCourse);

// Reviews
router.get('/reviews/flagged', getFlaggedReviews);
router.post('/reviews/:id/moderate', moderateReview);
router.delete('/reviews/:id', deleteReview);

export default router;
