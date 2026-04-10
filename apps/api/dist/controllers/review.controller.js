"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.respondToReview = exports.upvoteReview = exports.updateReview = exports.createReview = exports.getMyReview = exports.getCourseReviews = void 0;
const review_service_1 = require("../services/review.service");
const getCourseReviews = async (req, res) => {
    try {
        const reviews = await review_service_1.ReviewService.getCourseReviews(req.params.courseId);
        res.json({ reviews });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
};
exports.getCourseReviews = getCourseReviews;
const getMyReview = async (req, res) => {
    try {
        const review = await review_service_1.ReviewService.getMyReview(req.user.id, req.params.courseId);
        res.json({ review });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
};
exports.getMyReview = getMyReview;
const createReview = async (req, res) => {
    try {
        const { rating, content } = req.body;
        const review = await review_service_1.ReviewService.createReview(req.user.id, req.params.courseId, rating, content);
        res.json({ review });
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
};
exports.createReview = createReview;
const updateReview = async (req, res) => {
    try {
        const { rating, content } = req.body;
        const review = await review_service_1.ReviewService.updateReview(req.user.id, req.params.reviewId, rating, content);
        res.json({ review });
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
};
exports.updateReview = updateReview;
const upvoteReview = async (req, res) => {
    try {
        const result = await review_service_1.ReviewService.upvoteReview(req.user.id, req.params.reviewId);
        res.json(result);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
};
exports.upvoteReview = upvoteReview;
const respondToReview = async (req, res) => {
    try {
        const review = await review_service_1.ReviewService.instructorResponse(req.user.id, req.params.reviewId, req.body.response);
        res.json({ review });
    }
    catch (e) {
        res.status(403).json({ error: e.message });
    }
};
exports.respondToReview = respondToReview;
