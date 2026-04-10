"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const admin_controller_1 = require("../controllers/admin.controller");
const cms_controller_1 = require("../controllers/cms.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.requireAuth, auth_middleware_1.requireAdmin);
// Dashboard
router.get('/dashboard', admin_controller_1.getDashboard);
// Users & Applications
router.get('/users', admin_controller_1.getUsers);
router.get('/users/:id', admin_controller_1.getUserById);
router.post('/users/:id/role', admin_controller_1.updateUserRole);
router.post('/users/:id/suspend', admin_controller_1.suspendUser);
router.delete('/users/:id', admin_controller_1.deleteUser);
router.get('/applications', admin_controller_1.getApplications);
router.post('/applications/:id/review', admin_controller_1.reviewApplication);
// Courses
router.get('/courses', admin_controller_1.listAllCourses);
router.get('/courses/review', admin_controller_1.getCoursesForReview);
router.post('/courses/:id/moderate', admin_controller_1.moderateCourse);
router.post('/courses/:id/featured', admin_controller_1.toggleFeatured);
router.post('/courses/:id/unpublish', admin_controller_1.unpublishCourse);
router.delete('/courses/:id', admin_controller_1.deleteCourse);
// Reviews
router.get('/reviews/flagged', admin_controller_1.getFlaggedReviews);
router.get('/reviews/moderation', admin_controller_1.getReviewsModeration);
router.post('/reviews/:id/moderate', admin_controller_1.moderateReview);
router.delete('/reviews/:id', admin_controller_1.deleteReview);
// Questions moderation
router.get('/questions/moderation', admin_controller_1.getQuestionsModeration);
// Coupons
router.get('/coupons', admin_controller_1.getCoupons);
router.post('/coupons', admin_controller_1.createCoupon);
router.patch('/coupons/:id', admin_controller_1.updateCoupon);
router.delete('/coupons/:id', admin_controller_1.deleteCoupon);
// Refunds
router.get('/refunds', admin_controller_1.getRefunds);
router.post('/refunds/:id/approve', admin_controller_1.approveRefund);
router.post('/refunds/:id/reject', admin_controller_1.rejectRefund);
// Revenue analytics
router.get('/revenue', admin_controller_1.getRevenue);
// Notifications / Broadcasts
router.get('/notifications/broadcasts', admin_controller_1.getBroadcasts);
router.post('/notifications/broadcast', admin_controller_1.sendBroadcast);
// Platform Settings
router.get('/settings', admin_controller_1.getSettings);
router.patch('/settings', admin_controller_1.updateSettings);
// Categories
router.get('/categories', admin_controller_1.getCategories);
router.post('/categories', admin_controller_1.createCategory);
router.patch('/categories/:id', admin_controller_1.updateCategory);
router.delete('/categories/:id', admin_controller_1.deleteCategory);
// CMS: Homepage sections
router.get('/homepage/sections', cms_controller_1.getHomepageSections);
router.patch('/homepage/sections/:key', cms_controller_1.updateHomepageSection);
router.post('/homepage/sections/reorder', cms_controller_1.reorderHomepageSections);
// CMS: Static pages
router.get('/pages', cms_controller_1.listPages);
router.get('/pages/:id', cms_controller_1.getPage);
router.post('/pages', cms_controller_1.createPage);
router.patch('/pages/:id', cms_controller_1.updatePage);
router.delete('/pages/:id', cms_controller_1.deletePage);
// CMS: Audit log
router.get('/audit-logs', cms_controller_1.getAuditLogs);
exports.default = router;
