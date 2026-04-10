"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const review_controller_1 = require("../controllers/review.controller");
const router = (0, express_1.Router)();
// Publicly readable endpoint (if desired, but auth is often passed anyway to check upvote status)
router.get('/courses/:courseId', review_controller_1.getCourseReviews);
// Farmer authenticated endpoints
router.use(auth_middleware_1.requireAuth);
router.get('/courses/:courseId/me', review_controller_1.getMyReview);
router.post('/courses/:courseId', review_controller_1.createReview);
router.put('/:reviewId', review_controller_1.updateReview);
router.post('/:reviewId/upvote', review_controller_1.upvoteReview);
// Instructor authenticated endpoints
router.post('/:reviewId/respond', auth_middleware_1.requireInstructor, review_controller_1.respondToReview);
exports.default = router;
