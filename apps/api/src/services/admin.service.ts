import { prisma } from '@farmwise/db';
import { stripe } from './stripe.service';
import { NotificationService } from './notification.service';

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

    static async moderateCourse(courseId: string, action: string, feedback?: string) {
        const normalized = String(action || '').toUpperCase();
        if (normalized !== 'APPROVE' && normalized !== 'REJECT') {
            throw new Error('Invalid action: must be APPROVE or REJECT');
        }
        const isApprove = normalized === 'APPROVE';
        const course = await prisma.course.update({
             where: { id: courseId },
             data: {
                 status: isApprove ? 'PUBLISHED' : 'DRAFT',
                 ...(isApprove ? { publishedAt: new Date() } : {}),
                 ...(feedback && !isApprove ? { moderationFeedback: feedback } : {}),
             }
        });
        return course;
    }

    static async toggleCourseFeatured(courseId: string, isFeatured: boolean) {
         return prisma.course.update({
             where: { id: courseId },
             data: { isFeatured }
         });
    }

    static async setSponsored(courseId: string, sponsoredUntil: string | null) {
         return prisma.course.update({
             where: { id: courseId },
             data: { sponsoredUntil: sponsoredUntil ? new Date(sponsoredUntil) : null }
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

    // --- SINGLE USER DETAIL ---
    static async getUserById(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                profile: true,
                enrollments: {
                    include: { course: { select: { id: true, title: true, slug: true } } },
                    orderBy: { createdAt: 'desc' },
                    take: 20
                },
                courses: {
                    select: { id: true, title: true, status: true, enrollmentCount: true },
                    orderBy: { createdAt: 'desc' }
                },
                reviews: { select: { id: true, rating: true, courseId: true, createdAt: true }, take: 10 },
                instructorApplications: { orderBy: { createdAt: 'desc' }, take: 5 },
                _count: {
                    select: { enrollments: true, courses: true, reviews: true, notifications: true }
                }
            }
        });
        if (!user) throw new Error('User not found');
        return user;
    }

    // --- REVIEWS MODERATION (all reviews, not just flagged) ---
    static async getReviewsForModeration(page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [reviews, total] = await Promise.all([
            prisma.review.findMany({
                skip, take: limit,
                include: {
                    user: { select: { profile: { select: { displayName: true } }, email: true } },
                    course: { select: { title: true, slug: true } }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.review.count()
        ]);
        return { reviews, total, page, totalPages: Math.ceil(total / limit) };
    }

    // --- QUESTIONS MODERATION ---
    static async getQuestionsForModeration(page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [questions, total] = await Promise.all([
            prisma.question.findMany({
                skip, take: limit,
                include: {
                    user: { select: { profile: { select: { displayName: true } }, email: true } },
                    answers: { select: { id: true } }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.question.count()
        ]);
        return { questions, total, page, totalPages: Math.ceil(total / limit) };
    }

    // --- COUPONS ---
    static async listCoupons(page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [coupons, total] = await Promise.all([
            prisma.coupon.findMany({
                skip, take: limit,
                include: { course: { select: { id: true, title: true } } },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.coupon.count()
        ]);
        return { coupons, total, page, totalPages: Math.ceil(total / limit) };
    }

    static async createCoupon(data: {
        code: string; type: 'PERCENTAGE' | 'FIXED'; value: number;
        maxUses?: number; expiresAt?: string; courseId?: string;
    }) {
        return prisma.coupon.create({
            data: {
                code: data.code.toUpperCase(),
                type: data.type,
                value: data.value,
                maxUses: data.maxUses ?? null,
                expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
                courseId: data.courseId ?? null
            }
        });
    }

    static async updateCoupon(couponId: string, data: {
        code?: string; type?: 'PERCENTAGE' | 'FIXED'; value?: number;
        maxUses?: number | null; expiresAt?: string | null; courseId?: string | null;
    }) {
        const updateData: any = {};
        if (data.code !== undefined) updateData.code = data.code.toUpperCase();
        if (data.type !== undefined) updateData.type = data.type;
        if (data.value !== undefined) updateData.value = data.value;
        if (data.maxUses !== undefined) updateData.maxUses = data.maxUses;
        if (data.expiresAt !== undefined) updateData.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
        if (data.courseId !== undefined) updateData.courseId = data.courseId;

        return prisma.coupon.update({
            where: { id: couponId },
            data: updateData
        });
    }

    static async deleteCoupon(couponId: string) {
        return prisma.coupon.delete({ where: { id: couponId } });
    }

    // --- REFUNDS ---
    static async listRefunds(status?: string, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const where: any = {};
        if (status === 'REFUNDED') {
            where.status = 'REFUNDED';
        } else if (status === 'ACTIVE') {
            // Show active enrollments (potential refund candidates)
            where.status = 'ACTIVE';
            where.paidAmount = { gt: 0 };
        } else {
            // Default: show refunded enrollments
            where.status = 'REFUNDED';
        }

        const [refunds, total] = await Promise.all([
            prisma.enrollment.findMany({
                where,
                skip, take: limit,
                include: {
                    user: { select: { id: true, email: true, profile: { select: { displayName: true } } } },
                    course: { select: { id: true, title: true } }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.enrollment.count({ where })
        ]);
        return { refunds, total, page, totalPages: Math.ceil(total / limit) };
    }

    static async approveRefund(enrollmentId: string) {
        const enrollment = await prisma.enrollment.findUnique({
            where: { id: enrollmentId },
            include: { course: { select: { title: true } }, user: { select: { id: true, phone: true, email: true } } }
        });
        if (!enrollment) throw new Error('Enrollment not found');
        if (enrollment.status === 'REFUNDED') throw new Error('Already refunded');

        // Issue Stripe refund if there was a payment
        if (enrollment.paymentIntentId) {
            await stripe.refunds.create({ payment_intent: enrollment.paymentIntentId });
        }

        const updated = await prisma.enrollment.update({
            where: { id: enrollmentId },
            data: { status: 'REFUNDED', refundedAt: new Date() }
        });

        // Notify user
        try {
            await NotificationService.notifyRefundApproved(
                enrollment.userId, enrollment.course.title,
                Number(enrollment.paidAmount),
                enrollment.user.phone, enrollment.user.email
            );
        } catch (e) { console.error('Failed to send refund notification:', e); }

        return updated;
    }

    static async rejectRefund(enrollmentId: string) {
        // For rejection, we just keep the enrollment as ACTIVE
        const enrollment = await prisma.enrollment.findUnique({ where: { id: enrollmentId } });
        if (!enrollment) throw new Error('Enrollment not found');
        return { message: 'Refund request rejected', enrollment };
    }

    // --- REVENUE ANALYTICS ---
    static async getRevenueAnalytics() {
        // Total revenue
        const totalResult = await prisma.enrollment.aggregate({
            _sum: { paidAmount: true },
            where: { status: { in: ['ACTIVE', 'REFUNDED'] } }
        });
        const totalRevenue = totalResult._sum.paidAmount || 0;

        // Total refunded
        const refundedResult = await prisma.enrollment.aggregate({
            _sum: { paidAmount: true },
            where: { status: 'REFUNDED' }
        });
        const totalRefunded = refundedResult._sum.paidAmount || 0;

        // Net revenue
        const netRevenue = Number(totalRevenue) - Number(totalRefunded);

        // Active enrollments revenue
        const activeResult = await prisma.enrollment.aggregate({
            _sum: { paidAmount: true },
            where: { status: 'ACTIVE' }
        });
        const activeRevenue = activeResult._sum.paidAmount || 0;

        // Revenue by month (last 12 months)
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

        const recentEnrollments = await prisma.enrollment.findMany({
            where: { status: 'ACTIVE', createdAt: { gte: twelveMonthsAgo }, paidAmount: { gt: 0 } },
            select: { paidAmount: true, createdAt: true },
            orderBy: { createdAt: 'asc' }
        });

        const monthlyRevenue: Record<string, number> = {};
        for (const e of recentEnrollments) {
            const key = `${e.createdAt.getFullYear()}-${String(e.createdAt.getMonth() + 1).padStart(2, '0')}`;
            monthlyRevenue[key] = (monthlyRevenue[key] || 0) + Number(e.paidAmount);
        }

        // Top courses by revenue
        const topCourses = await prisma.enrollment.groupBy({
            by: ['courseId'],
            _sum: { paidAmount: true },
            _count: { id: true },
            where: { status: 'ACTIVE', paidAmount: { gt: 0 } },
            orderBy: { _sum: { paidAmount: 'desc' } },
            take: 10
        });

        const courseIds = topCourses.map(c => c.courseId);
        const courses = await prisma.course.findMany({
            where: { id: { in: courseIds } },
            select: { id: true, title: true }
        });
        const courseMap = new Map(courses.map(c => [c.id, c.title]));

        const topCourseRevenue = topCourses.map(c => ({
            courseId: c.courseId,
            title: courseMap.get(c.courseId) || 'Unknown',
            revenue: c._sum.paidAmount,
            enrollments: c._count.id
        }));

        return {
            totalRevenue,
            totalRefunded,
            netRevenue,
            activeRevenue,
            monthlyRevenue,
            topCourses: topCourseRevenue
        };
    }

    // --- NOTIFICATIONS / BROADCASTS ---
    static async getBroadcastHistory(page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [broadcasts, total] = await Promise.all([
            prisma.notification.findMany({
                where: { type: 'ANNOUNCEMENT' },
                skip, take: limit,
                orderBy: { createdAt: 'desc' },
                select: { id: true, title: true, body: true, createdAt: true }
            }),
            prisma.notification.count({ where: { type: 'ANNOUNCEMENT' } })
        ]);
        return { broadcasts, total, page, totalPages: Math.ceil(total / limit) };
    }

    static async sendBroadcast(
        title: string,
        body: string,
        link?: string,
        recipients?: string,
        channels?: string[]
    ) {
        const activeChannels = channels && channels.length > 0
            ? channels
            : ['inApp'];

        // Filter users by recipient group
        const where: any = { isVerified: true };
        if (recipients === 'ALL_FARMERS') where.role = 'FARMER';
        else if (recipients === 'ALL_INSTRUCTORS') where.role = 'INSTRUCTOR';
        // ALL_USERS or undefined → no role filter

        const users = await prisma.user.findMany({
            select: { id: true, email: true, phone: true },
            where,
        });

        const wantsInApp = activeChannels.includes('inApp');
        const wantsEmail = activeChannels.includes('email');
        const wantsSms = activeChannels.includes('sms');

        // 1. In-app notifications (bulk insert — fast)
        if (wantsInApp) {
            await prisma.notification.createMany({
                data: users.map(u => ({
                    userId: u.id,
                    type: 'ANNOUNCEMENT' as const,
                    title,
                    body,
                    link: link ?? null,
                })),
            });
        }

        // 2. Email notifications via queue
        if (wantsEmail) {
            const { notificationQueue } = await import('../jobs/queue');
            const emailUsers = users.filter(u => u.email);
            for (const u of emailUsers) {
                await notificationQueue.add('BROADCAST_EMAIL', {
                    userId: u.id,
                    type: 'ANNOUNCEMENT',
                    title,
                    body,
                    emailOptions: {
                        to: u.email!,
                        subject: title,
                        html: `<h2>${title}</h2><p>${body}</p>${link ? `<p><a href="${link}">Learn more</a></p>` : ''}`,
                    },
                });
            }
        }

        // 3. SMS notifications via queue (<=160 chars enforced)
        if (wantsSms) {
            const { notificationQueue } = await import('../jobs/queue');
            const smsMessage = `AAN Academy: ${body}`.substring(0, 160);
            const smsUsers = users.filter(u => u.phone);
            for (const u of smsUsers) {
                await notificationQueue.add('BROADCAST_SMS', {
                    userId: u.id,
                    type: 'ANNOUNCEMENT',
                    title,
                    body,
                    smsOptions: {
                        to: u.phone!,
                        message: smsMessage,
                    },
                });
            }
        }

        return {
            recipientCount: users.length,
            title,
            body,
            channels: activeChannels,
        };
    }

    // --- PLATFORM SETTINGS (persisted via PlatformConfig table) ---
    static async getSettings() {
        const { CmsService } = await import('./cms.service');
        return CmsService.getSettings();
    }

    static async updateSettings(section: string, data: Record<string, any>) {
        const { CmsService } = await import('./cms.service');
        await CmsService.updateSettings(section, data);
        return CmsService.getSettings();
    }

    // --- CATEGORIES ---
    static async listCategories() {
        // Return all categories with course counts — frontend builds the tree
        return prisma.category.findMany({
            include: {
                _count: { select: { courses: true } },
                children: {
                    include: { _count: { select: { courses: true } } },
                    orderBy: { name: 'asc' }
                }
            },
            orderBy: { name: 'asc' }
        });
    }

    static async createCategory(data: { name: string; slug: string; description?: string; iconName?: string; imageUrl?: string; parentId?: string }) {
        return prisma.category.create({ data });
    }

    static async updateCategory(categoryId: string, data: { name?: string; slug?: string; description?: string; iconName?: string; imageUrl?: string | null; parentId?: string | null }) {
        const updateData: any = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.slug !== undefined) updateData.slug = data.slug;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.iconName !== undefined) updateData.iconName = data.iconName;
        if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
        if (data.parentId !== undefined) updateData.parentId = data.parentId;

        return prisma.category.update({
            where: { id: categoryId },
            data: updateData
        });
    }

    static async deleteCategory(categoryId: string) {
        // Check if category has courses
        const courseCount = await prisma.course.count({ where: { categoryId } });
        if (courseCount > 0) {
            throw new Error('Cannot delete category: it has associated courses. Reassign them first.');
        }
        return prisma.category.delete({ where: { id: categoryId } });
    }
}
