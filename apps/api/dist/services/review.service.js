"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewService = void 0;
const db_1 = require("@farmwise/db");
const notification_service_1 = require("./notification.service");
class ReviewService {
    static async getCourseReviews(courseId) {
        return db_1.prisma.review.findMany({
            where: { courseId, isHidden: false },
            include: {
                user: { select: { profile: { select: { displayName: true, avatarPublicId: true } } } },
                upvoters: { select: { userId: true } }
            },
            orderBy: [{ upvotes: 'desc' }, { createdAt: 'desc' }]
        });
    }
    static async getMyReview(userId, courseId) {
        return db_1.prisma.review.findUnique({
            where: { userId_courseId: { userId, courseId } }
        });
    }
    static async createReview(userId, courseId, rating, content) {
        const enrollment = await db_1.prisma.enrollment.findUnique({
            where: { userId_courseId: { userId, courseId } }
        });
        if (!enrollment || enrollment.status !== 'ACTIVE')
            throw new Error("Must be enrolled to review");
        const editableUntil = new Date();
        editableUntil.setDate(editableUntil.getDate() + 60);
        const review = await db_1.prisma.review.create({
            data: { userId, courseId, rating, content, editableUntil }
        });
        await this.updateCourseRating(courseId);
        // Notify the instructor about the new review
        try {
            const course = await db_1.prisma.course.findUnique({
                where: { id: courseId },
                select: { title: true, instructorId: true },
            });
            if (course) {
                const instructor = await db_1.prisma.user.findUnique({
                    where: { id: course.instructorId },
                    select: { phone: true, email: true },
                });
                await notification_service_1.NotificationService.notifyReviewReceived(course.instructorId, course.title, rating, instructor?.phone, instructor?.email);
            }
        }
        catch (notifyErr) {
            console.error('Failed to send review notification:', notifyErr);
        }
        return review;
    }
    static async updateReview(userId, reviewId, rating, content) {
        const review = await db_1.prisma.review.findUnique({ where: { id: reviewId } });
        if (!review || review.userId !== userId)
            throw new Error("Unauthorised or not owner");
        if (review.editableUntil && review.editableUntil < new Date())
            throw new Error("Review edit period has expired");
        const updated = await db_1.prisma.review.update({
            where: { id: reviewId },
            data: { rating, content, updatedAt: new Date() }
        });
        await this.updateCourseRating(updated.courseId);
        return updated;
    }
    static async instructorResponse(instructorId, reviewId, response) {
        const review = await db_1.prisma.review.findUnique({ where: { id: reviewId }, include: { course: true } });
        if (!review || review.course.instructorId !== instructorId)
            throw new Error("Unauthorised");
        return db_1.prisma.review.update({
            where: { id: reviewId },
            data: { instructorResponse: response, respondedAt: new Date() }
        });
    }
    static async updateCourseRating(courseId) {
        const aggregates = await db_1.prisma.review.aggregate({
            where: { courseId, isHidden: false },
            _avg: { rating: true },
            _count: { rating: true }
        });
        await db_1.prisma.course.update({
            where: { id: courseId },
            data: {
                averageRating: aggregates._avg.rating || 0,
                reviewCount: aggregates._count.rating || 0
            }
        });
    }
    static async upvoteReview(userId, reviewId) {
        const existing = await db_1.prisma.reviewUpvote.findUnique({
            where: { userId_reviewId: { userId, reviewId } }
        });
        if (existing) {
            await db_1.prisma.reviewUpvote.delete({ where: { userId_reviewId: { userId, reviewId } } });
            await db_1.prisma.review.update({ where: { id: reviewId }, data: { upvotes: { decrement: 1 } } });
            return { upvoted: false };
        }
        else {
            await db_1.prisma.reviewUpvote.create({ data: { userId, reviewId } });
            await db_1.prisma.review.update({ where: { id: reviewId }, data: { upvotes: { increment: 1 } } });
            return { upvoted: true };
        }
    }
}
exports.ReviewService = ReviewService;
