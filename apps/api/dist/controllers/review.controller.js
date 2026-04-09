import { ReviewService } from '../services/review.service';
export const getCourseReviews = async (req, res) => {
    try {
        const reviews = await ReviewService.getCourseReviews(req.params.courseId);
        res.json({ reviews });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
};
export const getMyReview = async (req, res) => {
    try {
        const review = await ReviewService.getMyReview(req.user.id, req.params.courseId);
        res.json({ review });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
};
export const createReview = async (req, res) => {
    try {
        const { rating, content } = req.body;
        const review = await ReviewService.createReview(req.user.id, req.params.courseId, rating, content);
        res.json({ review });
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
};
export const updateReview = async (req, res) => {
    try {
        const { rating, content } = req.body;
        const review = await ReviewService.updateReview(req.user.id, req.params.reviewId, rating, content);
        res.json({ review });
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
};
export const upvoteReview = async (req, res) => {
    try {
        const result = await ReviewService.upvoteReview(req.user.id, req.params.reviewId);
        res.json(result);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
};
export const respondToReview = async (req, res) => {
    try {
        const review = await ReviewService.instructorResponse(req.user.id, req.params.reviewId, req.body.response);
        res.json({ review });
    }
    catch (e) {
        res.status(403).json({ error: e.message });
    }
};
