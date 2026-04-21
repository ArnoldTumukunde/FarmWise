import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware';
import {
    getDashboard, getUsers, getApplications, reviewApplication,
    updateUserRole, suspendUser, deleteUser,
    listAllCourses, getCoursesForReview, moderateCourse, toggleFeatured, setSponsored,
    deleteCourse, unpublishCourse, publishCourse,
    getFlaggedReviews, moderateReview, deleteReview,
    getUserById,
    getReviewsModeration, getQuestionsModeration,
    getCoupons, createCoupon, updateCoupon, deleteCoupon,
    getRefunds, approveRefund, rejectRefund,
    getRevenue,
    getBroadcasts, sendBroadcast,
    getSettings, updateSettings,
    getCategories, createCategory, updateCategory, deleteCategory
} from '../controllers/admin.controller';
import {
    getHomepageSections, updateHomepageSection, reorderHomepageSections,
    listPages, getPage, createPage, updatePage, deletePage,
    getAuditLogs
} from '../controllers/cms.controller';

const router = Router();
router.use(requireAuth, requireAdmin);

// Dashboard
router.get('/dashboard', getDashboard);

// Users & Applications
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
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
router.post('/courses/:id/sponsored', setSponsored);
router.post('/courses/:id/unpublish', unpublishCourse);
router.post('/courses/:id/publish', publishCourse);
router.delete('/courses/:id', deleteCourse);

// Reviews
router.get('/reviews/flagged', getFlaggedReviews);
router.get('/reviews/moderation', getReviewsModeration);
router.post('/reviews/:id/moderate', moderateReview);
router.delete('/reviews/:id', deleteReview);

// Questions moderation
router.get('/questions/moderation', getQuestionsModeration);

// Coupons
router.get('/coupons', getCoupons);
router.post('/coupons', createCoupon);
router.patch('/coupons/:id', updateCoupon);
router.delete('/coupons/:id', deleteCoupon);

// Refunds
router.get('/refunds', getRefunds);
router.post('/refunds/:id/approve', approveRefund);
router.post('/refunds/:id/reject', rejectRefund);

// Revenue analytics
router.get('/revenue', getRevenue);

// Notifications / Broadcasts
router.get('/notifications/broadcasts', getBroadcasts);
router.post('/notifications/broadcast', sendBroadcast);

// Platform Settings
router.get('/settings', getSettings);
router.patch('/settings', updateSettings);

// Categories
router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.patch('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// CMS: Homepage sections
router.get('/homepage/sections', getHomepageSections);
router.patch('/homepage/sections/:key', updateHomepageSection);
router.post('/homepage/sections/reorder', reorderHomepageSections);

// CMS: Static pages
router.get('/pages', listPages);
router.get('/pages/:id', getPage);
router.post('/pages', createPage);
router.patch('/pages/:id', updatePage);
router.delete('/pages/:id', deletePage);

// CMS: Audit log
router.get('/audit-logs', getAuditLogs);

export default router;
