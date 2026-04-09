import { prisma } from '@farmwise/db';
import { stripe } from './stripe.service';
import { NotificationService } from './notification.service';
export class EnrollmentService {
    /**
     * Creates a PENDING enrollment before Stripe checkout.
     * Returns null if enrollment already exists and is ACTIVE.
     */
    static async createPendingEnrollment(userId, courseId) {
        const existing = await prisma.enrollment.findUnique({
            where: { userId_courseId: { userId, courseId } },
        });
        if (existing?.status === 'ACTIVE') {
            return { alreadyActive: true, enrollment: existing };
        }
        const enrollment = await prisma.enrollment.upsert({
            where: { userId_courseId: { userId, courseId } },
            update: { status: 'PENDING' },
            create: { userId, courseId, status: 'PENDING', paidAmount: 0 },
        });
        return { alreadyActive: false, enrollment };
    }
    /**
     * Stores the Stripe session ID on the enrollment after session creation.
     */
    static async setStripeSessionId(userId, courseId, stripeSessionId) {
        await prisma.enrollment.update({
            where: { userId_courseId: { userId, courseId } },
            data: { stripeSessionId },
        });
    }
    /**
     * Activates an enrollment after a successful Stripe checkout session.
     * Looks up by stripeSessionId and validates payment_status.
     */
    static async activateEnrollment(session) {
        const userId = session.metadata?.userId;
        const courseId = session.metadata?.courseId;
        const paymentId = session.payment_intent;
        if (!userId || !courseId) {
            console.error("Missing metadata in Stripe session", session.id);
            return;
        }
        if (session.payment_status !== 'paid') {
            console.warn(`Session ${session.id} payment_status is ${session.payment_status}, skipping activation`);
            return;
        }
        // Convert amount - for zero-decimal currencies the amount IS the amount
        const paidAmount = session.amount_total ?? 0;
        // Look up by stripeSessionId first, fall back to userId+courseId
        let enrollment = await prisma.enrollment.findFirst({
            where: { stripeSessionId: session.id },
        });
        if (!enrollment) {
            enrollment = await prisma.enrollment.findUnique({
                where: { userId_courseId: { userId, courseId } },
            });
        }
        if (!enrollment) {
            console.error(`No enrollment found for session ${session.id}, userId=${userId}, courseId=${courseId}`);
            return;
        }
        await prisma.enrollment.update({
            where: { id: enrollment.id },
            data: {
                status: 'ACTIVE',
                paidAmount,
                paymentIntentId: paymentId,
            },
        });
        // Send enrollment confirmation notification
        try {
            const course = await prisma.course.findUnique({ where: { id: courseId }, select: { title: true } });
            const user = await prisma.user.findUnique({ where: { id: userId }, select: { phone: true, email: true } });
            if (course) {
                await NotificationService.notifyEnrollmentConfirmed(userId, course.title, user?.phone, user?.email);
            }
        }
        catch (notifyErr) {
            console.error('Failed to send enrollment notification:', notifyErr);
        }
    }
    /**
     * Activates an enrollment by paymentIntentId (for payment_intent.succeeded webhook).
     */
    static async activateByPaymentIntent(paymentIntentId) {
        const enrollment = await prisma.enrollment.findFirst({
            where: { paymentIntentId },
        });
        if (!enrollment) {
            console.warn(`No enrollment found for paymentIntentId=${paymentIntentId}`);
            return;
        }
        if (enrollment.status === 'PENDING') {
            await prisma.enrollment.update({
                where: { id: enrollment.id },
                data: { status: 'ACTIVE' },
            });
        }
    }
    /**
     * Fast-track enrollment for free courses without Stripe.
     */
    static async enrollFreeCourse(userId, courseId) {
        return prisma.enrollment.upsert({
            where: {
                userId_courseId: { userId, courseId }
            },
            update: {
                status: 'ACTIVE',
                paidAmount: 0
            },
            create: {
                userId,
                courseId,
                paidAmount: 0,
                status: 'ACTIVE'
            }
        });
    }
    /**
     * Check if a user is currently enrolled in a specific course.
     */
    static async isEnrolled(userId, courseId) {
        const enrollment = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: { userId, courseId }
            }
        });
        return enrollment?.status === 'ACTIVE';
    }
    static async getUserEnrollments(userId) {
        const enrollments = await prisma.enrollment.findMany({
            where: { userId, status: 'ACTIVE' },
            include: {
                course: {
                    select: {
                        id: true, title: true, slug: true, thumbnailPublicId: true,
                        instructor: { select: { profile: { select: { displayName: true } } } },
                        sections: {
                            select: {
                                lectures: { select: { id: true } },
                            },
                        },
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        const enrollmentIds = enrollments.map(e => e.id);
        const completedCounts = await prisma.lectureProgress.groupBy({
            by: ['enrollmentId'],
            where: {
                enrollmentId: { in: enrollmentIds },
                isCompleted: true,
            },
            _count: { id: true },
        });
        const completedMap = new Map(completedCounts.map(c => [c.enrollmentId, c._count.id]));
        return enrollments.map(enrollment => {
            const totalLectures = enrollment.course.sections.reduce((sum, section) => sum + section.lectures.length, 0);
            const completedCount = completedMap.get(enrollment.id) ?? 0;
            const progressPercent = totalLectures > 0
                ? Math.round((completedCount / totalLectures) * 100)
                : 0;
            // Remove sections from the response (only needed for counting)
            const { sections, ...courseWithoutSections } = enrollment.course;
            return {
                ...enrollment,
                course: courseWithoutSections,
                progressPercent,
            };
        });
    }
    static async getEnrolledCourseContent(userId, courseIdOrSlug) {
        // Resolve slug to course ID if needed
        let resolvedCourseId = courseIdOrSlug;
        const isCuid = courseIdOrSlug.length > 20 && !courseIdOrSlug.includes('-');
        if (!isCuid) {
            const course = await prisma.course.findFirst({
                where: { slug: courseIdOrSlug },
                select: { id: true },
            });
            if (course)
                resolvedCourseId = course.id;
        }
        const enrollment = await prisma.enrollment.findUnique({
            where: { userId_courseId: { userId, courseId: resolvedCourseId } }
        });
        if (!enrollment || enrollment.status !== 'ACTIVE') {
            throw new Error('Not enrolled');
        }
        const course = await prisma.course.findUnique({
            where: { id: resolvedCourseId },
            include: {
                instructor: { select: { profile: { select: { displayName: true } } } },
                sections: {
                    orderBy: { order: 'asc' },
                    include: {
                        lectures: {
                            orderBy: { order: 'asc' },
                            select: {
                                id: true,
                                title: true,
                                order: true,
                                type: true,
                                videoStatus: true,
                                hlsUrl: true,
                                duration: true,
                                fileSizeBytes: true,
                                isPreview: true,
                                content: true,
                                quizData: true,
                                // videoPublicId is intentionally EXCLUDED - never expose to client
                            }
                        }
                    }
                }
            }
        });
        const progress = await prisma.lectureProgress.findMany({
            where: { userId, enrollmentId: enrollment.id }
        });
        // Map progress to include completedLectureIds for client convenience
        const completedLectureIds = progress
            .filter(p => p.isCompleted)
            .map(p => p.lectureId);
        return {
            course,
            progress: { completedLectureIds, records: progress },
            enrollmentId: enrollment.id,
        };
    }
    /**
     * Request a refund for a course enrollment.
     * Auto-approves if < 30 days since enrollment AND < 30% lectures completed.
     */
    static async requestRefund(userId, courseId) {
        const enrollment = await prisma.enrollment.findUnique({
            where: { userId_courseId: { userId, courseId } },
            include: {
                course: {
                    include: {
                        sections: {
                            include: {
                                lectures: { select: { id: true } },
                            },
                        },
                    },
                },
            },
        });
        if (!enrollment || enrollment.status !== 'ACTIVE') {
            throw new Error('No active enrollment found');
        }
        // Check < 30 days since enrollment
        const daysSinceEnrollment = (Date.now() - enrollment.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceEnrollment >= 30) {
            throw new Error('Refund not eligible: enrollment is older than 30 days');
        }
        // Check < 30% of lectures completed
        const totalLectures = enrollment.course.sections.reduce((sum, section) => sum + section.lectures.length, 0);
        if (totalLectures > 0) {
            const completedCount = await prisma.lectureProgress.count({
                where: {
                    enrollmentId: enrollment.id,
                    isCompleted: true,
                },
            });
            if (completedCount / totalLectures >= 0.3) {
                throw new Error('Refund not eligible: more than 30% of lectures completed');
            }
        }
        // Auto-approve: issue Stripe refund if there was a payment
        if (enrollment.paymentIntentId) {
            await stripe.refunds.create({
                payment_intent: enrollment.paymentIntentId,
            });
        }
        // Update enrollment status
        const updated = await prisma.enrollment.update({
            where: { id: enrollment.id },
            data: {
                status: 'REFUNDED',
                refundedAt: new Date(),
            },
        });
        // Send refund approved notification
        try {
            const user = await prisma.user.findUnique({ where: { id: userId }, select: { phone: true, email: true } });
            await NotificationService.notifyRefundApproved(userId, enrollment.course.title, Number(enrollment.paidAmount), user?.phone, user?.email);
        }
        catch (notifyErr) {
            console.error('Failed to send refund notification:', notifyErr);
        }
        return updated;
    }
}
