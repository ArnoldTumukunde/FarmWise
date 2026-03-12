import { prisma } from '@farmwise/db';

export class ReviewService {
    static async getCourseReviews(courseId: string) {
        return prisma.review.findMany({
            where: { courseId, isHidden: false },
            include: {
                user: { select: { profile: { select: { displayName: true, avatarPublicId: true } } } },
                upvoters: { select: { userId: true } }
            },
            orderBy: [{ upvotes: 'desc' }, { createdAt: 'desc' }]
        });
    }

    static async getMyReview(userId: string, courseId: string) {
        return prisma.review.findUnique({
             where: { userId_courseId: { userId, courseId } }
        });
    }

    static async createReview(userId: string, courseId: string, rating: number, content?: string) {
        const enrollment = await prisma.enrollment.findUnique({
            where: { userId_courseId: { userId, courseId } }
        });
        if (!enrollment || enrollment.status !== 'ACTIVE') throw new Error("Must be enrolled to review");

        const editableUntil = new Date();
        editableUntil.setDate(editableUntil.getDate() + 60);

        const review = await prisma.review.create({
            data: { userId, courseId, rating, content, editableUntil }
        });

        await this.updateCourseRating(courseId);
        return review;
    }

    static async updateReview(userId: string, reviewId: string, rating: number, content?: string) {
        const review = await prisma.review.findUnique({ where: { id: reviewId } });
        if (!review || review.userId !== userId) throw new Error("Unauthorised or not owner");
        if (review.editableUntil && review.editableUntil < new Date()) throw new Error("Review edit period has expired");
        
        const updated = await prisma.review.update({
            where: { id: reviewId },
            data: { rating, content, updatedAt: new Date() }
        });
        await this.updateCourseRating(updated.courseId);
        return updated;
    }

    static async instructorResponse(instructorId: string, reviewId: string, response: string) {
        const review = await prisma.review.findUnique({ where: { id: reviewId }, include: { course: true } });
        if (!review || review.course.instructorId !== instructorId) throw new Error("Unauthorised");

        return prisma.review.update({
            where: { id: reviewId },
            data: { instructorResponse: response, respondedAt: new Date() }
        });
    }

    static async updateCourseRating(courseId: string) {
        const aggregates = await prisma.review.aggregate({
             where: { courseId, isHidden: false },
             _avg: { rating: true },
             _count: { rating: true }
        });

        await prisma.course.update({
             where: { id: courseId },
             data: {
                 averageRating: aggregates._avg.rating || 0,
                 reviewCount: aggregates._count.rating || 0
             }
        });
    }

    static async upvoteReview(userId: string, reviewId: string) {
        const existing = await prisma.reviewUpvote.findUnique({
            where: { userId_reviewId: { userId, reviewId } }
        });

        if (existing) {
            await prisma.reviewUpvote.delete({ where: { userId_reviewId: { userId, reviewId } } });
            await prisma.review.update({ where: { id: reviewId }, data: { upvotes: { decrement: 1 } } });
            return { upvoted: false };
        } else {
            await prisma.reviewUpvote.create({ data: { userId, reviewId } });
            await prisma.review.update({ where: { id: reviewId }, data: { upvotes: { increment: 1 } } });
            return { upvoted: true };
        }
    }
}
