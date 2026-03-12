import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { ReviewService } from '../services/review.service';

export const getCourseReviews = async (req: AuthRequest, res: Response) => {
    try {
        const reviews = await ReviewService.getCourseReviews(req.params.courseId);
        res.json({ reviews });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
};

export const getMyReview = async (req: AuthRequest, res: Response) => {
    try {
        const review = await ReviewService.getMyReview(req.user!.id, req.params.courseId);
        res.json({ review });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
};

export const createReview = async (req: AuthRequest, res: Response) => {
    try {
        const { rating, content } = req.body;
        const review = await ReviewService.createReview(req.user!.id, req.params.courseId, rating, content);
        res.json({ review });
    } catch (e: any) { res.status(400).json({ error: e.message }); }
};

export const updateReview = async (req: AuthRequest, res: Response) => {
    try {
        const { rating, content } = req.body;
        const review = await ReviewService.updateReview(req.user!.id, req.params.reviewId, rating, content);
        res.json({ review });
    } catch (e: any) { res.status(400).json({ error: e.message }); }
};

export const upvoteReview = async (req: AuthRequest, res: Response) => {
    try {
        const result = await ReviewService.upvoteReview(req.user!.id, req.params.reviewId);
        res.json(result);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
};

export const respondToReview = async (req: AuthRequest, res: Response) => {
    try {
        const review = await ReviewService.instructorResponse(req.user!.id, req.params.reviewId, req.body.response);
        res.json({ review });
    } catch (e: any) { res.status(403).json({ error: e.message }); }
};
