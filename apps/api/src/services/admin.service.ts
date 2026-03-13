import { prisma } from '@farmwise/db';

export class AdminService {
    // --- DASHBOARD KPIs ---
    static async getDashboardKPIs() {
        const totalUsers = await prisma.user.count();
        const activeCourses = await prisma.course.count({ where: { status: 'PUBLISHED' } });
        
        // Sum of all paid enrollments
        const totalRevenueResult = await prisma.enrollment.aggregate({
            _sum: { paidAmount: true },
            where: { status: 'ACTIVE' }
        });
        const totalRevenue = totalRevenueResult._sum.paidAmount || 0;

        const totalDownloads = await prisma.offlineDownload.count({
            where: { status: 'DOWNLOADED' }
        });

        // Get 5 most recent pending applications
        const pendingApplications = await prisma.instructorApplication.findMany({
             where: { status: 'PENDING' },
             include: { user: { select: { profile: true, email: true } } },
             orderBy: { createdAt: 'desc' },
             take: 5
        });

        const recentUsers = await prisma.user.findMany({
            include: { profile: true },
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        const recentCourses = await prisma.course.findMany({
            include: { instructor: { select: { profile: true } } },
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        const pendingCoursesCount = await prisma.course.count({
            where: { status: 'UNDER_REVIEW' }
        });

        const flaggedReviewsCount = await prisma.review.count({
            where: { rating: 1, isHidden: false }
        });

        return {
            totalUsers,
            activeCourses,
            totalRevenue,
            totalDownloads,
            pendingApplications,
            recentUsers,
            recentCourses,
            pendingCoursesCount,
            flaggedReviewsCount
        };
    }

    // --- USERS & INSTRUCTORS ---
    static async listUsers(page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            prisma.user.findMany({
                skip, take: limit,
                include: { profile: true },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.user.count()
        ]);
        return { users, total, page, totalPages: Math.ceil(total / limit) };
    }

    static async getInstructorApplications(status?: 'PENDING' | 'APPROVED' | 'REJECTED') {
        return prisma.instructorApplication.findMany({
            where: status ? { status } : undefined,
            include: { user: { select: { profile: true, email: true } } },
            orderBy: { createdAt: 'desc' }
        });
    }

    static async reviewInstructorApplication(adminId: string, applicationId: string, action: 'APPROVE' | 'REJECT', note?: string) {
        const status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
        
        return prisma.$transaction(async (tx) => {
            const app = await tx.instructorApplication.update({
                where: { id: applicationId },
                data: { status, reviewedBy: adminId, reviewNote: note }
            });

            if (action === 'APPROVE') {
                await tx.user.update({
                    where: { id: app.userId },
                    data: { role: 'INSTRUCTOR' }
                });
            }
            return app;
        });
    }

    static async updateUserRole(userId: string, role: 'FARMER' | 'INSTRUCTOR' | 'ADMIN') {
        return prisma.user.update({
            where: { id: userId },
            data: { role }
        });
    }

    static async suspendUser(userId: string, suspended: boolean) {
        return prisma.user.update({
            where: { id: userId },
            data: { isVerified: !suspended }
        });
    }

    static async deleteUser(userId: string) {
        // Check if user is an instructor with active enrollments
        const activeEnrollments = await prisma.enrollment.count({
            where: {
                course: { instructorId: userId },
                status: 'ACTIVE'
            }
        });

        if (activeEnrollments > 0) {
            throw new Error('Cannot delete user: they have active enrollments as an instructor');
        }

        return prisma.user.delete({ where: { id: userId } });
    }

    // --- COURSES ---
    static async listAllCourses(query: { status?: string; search?: string; page?: number }) {
        const page = query.page || 1;
        const limit = 20;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (query.status) where.status = query.status;
        if (query.search) {
            where.OR = [
                { title: { contains: query.search, mode: 'insensitive' } },
                { description: { contains: query.search, mode: 'insensitive' } }
            ];
        }

        const [courses, total] = await Promise.all([
            prisma.course.findMany({
                where,
                skip,
                take: limit,
                include: { instructor: { select: { profile: true } } },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.course.count({ where })
        ]);

        return { courses, total, page, totalPages: Math.ceil(total / limit) };
    }

    static async deleteCourse(courseId: string) {
        return prisma.$transaction(async (tx) => {
            await tx.enrollment.deleteMany({ where: { courseId } });
            const sections = await tx.section.findMany({ where: { courseId }, select: { id: true } });
            const sectionIds = sections.map((s) => s.id);
            await tx.lecture.deleteMany({ where: { sectionId: { in: sectionIds } } });
            await tx.section.deleteMany({ where: { courseId } });
            await tx.review.deleteMany({ where: { courseId } });
            return tx.course.delete({ where: { id: courseId } });
        });
    }

    static async unpublishCourse(courseId: string) {
        return prisma.course.update({
            where: { id: courseId },
            data: { status: 'DRAFT' }
        });
    }

    static async listCoursesForReview() {
        return prisma.course.findMany({
            where: { status: 'UNDER_REVIEW' },
            include: { instructor: { select: { profile: true } } },
            orderBy: { updatedAt: 'desc' }
        });
    }

    static async moderateCourse(courseId: string, action: 'APPROVE' | 'REJECT') {
        const status = action === 'APPROVE' ? 'PUBLISHED' : 'DRAFT';
        return prisma.course.update({
             where: { id: courseId },
             data: { 
                 status,
                 ...(action === 'APPROVE' ? { publishedAt: new Date() } : {})
             }
        });
    }

    static async toggleCourseFeatured(courseId: string, isFeatured: boolean) {
         return prisma.course.update({
             where: { id: courseId },
             data: { isFeatured }
         });
    }

    // --- REVIEWS ---
    static async listFlaggedReviews() {
        // Simple heuristic: 1-star reviews that might need moderation
        // In a real app, you might have an explicit `isFlagged` boolean
        return prisma.review.findMany({
            where: { rating: 1, isHidden: false },
            include: { 
                user: { select: { profile: true } },
                course: { select: { title: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    static async hideReview(reviewId: string, isHidden: boolean) {
        return prisma.review.update({
             where: { id: reviewId },
             data: { isHidden }
        });
    }

    static async deleteReview(reviewId: string) {
        return prisma.review.delete({ where: { id: reviewId } });
    }
}
