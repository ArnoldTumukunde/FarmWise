"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const queue_1 = require("../jobs/queue");
class NotificationService {
    static async notifyEnrollmentConfirmed(userId, courseTitle, userPhone, userEmail) {
        await queue_1.notificationQueue.add('ENROLLMENT_CONFIRMED', {
            userId,
            type: 'ENROLLMENT_CONFIRMED',
            title: 'Enrollment Confirmed',
            body: `You are now enrolled in ${courseTitle}. Start learning today!`,
            smsOptions: userPhone ? {
                to: userPhone,
                // SMS Constraint: <= 160 chars
                message: `FarmWise: Your enrollment in ${courseTitle.substring(0, 30)} is confirmed. Start learning offline now.`
            } : undefined,
            emailOptions: userEmail ? {
                to: userEmail,
                subject: `Welcome to ${courseTitle}`,
                html: `<p>You are now enrolled in <strong>${courseTitle}</strong>. Open the FarmWise app to begin watching lectures even when offline.</p>`
            } : undefined
        });
    }
    static async notifyReviewReceived(instructorId, courseTitle, rating, userPhone, userEmail) {
        await queue_1.notificationQueue.add('REVIEW_RECEIVED', {
            userId: instructorId,
            type: 'REVIEW_RECEIVED',
            title: 'New Course Review',
            body: `Your course ${courseTitle} received a new ${rating}-star review.`,
            smsOptions: userPhone ? {
                to: userPhone,
                message: `FarmWise: You received a new ${rating}-star review on ${courseTitle.substring(0, 30)}. Open your dashboard to respond.`
            } : undefined,
            emailOptions: userEmail ? {
                to: userEmail,
                subject: `New ${rating}-star review on ${courseTitle}`,
                html: `<p>Your course <strong>${courseTitle}</strong> just received a ${rating}-star review. Head to your instructor dashboard to read and respond.</p>`
            } : undefined
        });
    }
    static async notifyCertificateEarned(userId, courseTitle, userPhone, userEmail) {
        await queue_1.notificationQueue.add('CERTIFICATE_EARNED', {
            userId,
            type: 'CERTIFICATE_EARNED',
            title: 'Certificate Earned!',
            body: `Congratulations! You have completed ${courseTitle}. Download your certificate now.`,
            smsOptions: userPhone ? {
                to: userPhone,
                message: `FarmWise: Congrats! You finished ${courseTitle.substring(0, 30)}. Download your certificate in the app now.`
            } : undefined,
            emailOptions: userEmail ? {
                to: userEmail,
                subject: `Certificate of Completion: ${courseTitle}`,
                html: `<h2>Congratulations!</h2><p>You have successfully completed <strong>${courseTitle}</strong>. Log in to your FarmWise account to download your official certificate.</p>`
            } : undefined
        });
    }
    static async notifyRefundApproved(userId, courseTitle, amount, userPhone, userEmail) {
        await queue_1.notificationQueue.add('REFUND_APPROVED', {
            userId,
            type: 'REFUND_APPROVED',
            title: 'Refund Approved',
            body: `Your refund of UGX ${amount} for ${courseTitle} has been processed.`,
            smsOptions: userPhone ? {
                to: userPhone,
                message: `FarmWise: Your refund of UGX ${amount} for ${courseTitle.substring(0, 30)} is approved. Funds will return in 5-10 days.`
            } : undefined,
            emailOptions: userEmail ? {
                to: userEmail,
                subject: 'Your Refund has been Approved',
                html: `<p>Your refund of <strong>UGX ${amount}</strong> for the course ${courseTitle} has been processed successfully.</p>`
            } : undefined
        });
    }
    static async notifyReviewResponse(userId, courseTitle, userPhone, userEmail) {
        await queue_1.notificationQueue.add('REVIEW_RESPONSE', {
            userId,
            type: 'REVIEW_RESPONSE',
            title: 'Instructor Responded to Your Review',
            body: `The instructor for ${courseTitle} has responded to your review.`,
            smsOptions: userPhone ? {
                to: userPhone,
                message: `FarmWise: The instructor for ${courseTitle.substring(0, 30)} responded to your review. Check the app to see it.`
            } : undefined,
            emailOptions: userEmail ? {
                to: userEmail,
                subject: 'Instructor Responded to Your Review',
                html: `<p>The instructor for <strong>${courseTitle}</strong> has responded to your review.</p>`
            } : undefined
        });
    }
    static async notifyCourseApproved(instructorId, courseTitle, userPhone, userEmail) {
        await queue_1.notificationQueue.add('COURSE_APPROVED', {
            userId: instructorId,
            type: 'COURSE_APPROVED',
            title: 'Course Approved',
            body: `Your course ${courseTitle} has been approved and is now live!`,
            smsOptions: userPhone ? {
                to: userPhone,
                message: `FarmWise: Great news! Your course ${courseTitle.substring(0, 30)} has been approved and is now live on the marketplace.`
            } : undefined,
            emailOptions: userEmail ? {
                to: userEmail,
                subject: `Course Approved: ${courseTitle}`,
                html: `<p>Great news! Your course <strong>${courseTitle}</strong> has been approved and is now live on the marketplace.</p>`
            } : undefined
        });
    }
    static async notifyCourseRejected(instructorId, courseTitle, userPhone, userEmail) {
        await queue_1.notificationQueue.add('COURSE_REJECTED', {
            userId: instructorId,
            type: 'COURSE_REJECTED',
            title: 'Course Needs Revision',
            body: `Your course ${courseTitle} needs some revisions before it can go live.`,
            smsOptions: userPhone ? {
                to: userPhone,
                message: `FarmWise: Your course ${courseTitle.substring(0, 30)} was returned for revisions. Check your email for details.`
            } : undefined,
            emailOptions: userEmail ? {
                to: userEmail,
                subject: `Course Action Required: ${courseTitle}`,
                html: `<p>Your course <strong>${courseTitle}</strong> requires revisions before it can be published. Please log in to your dashboard to review the feedback.</p>`
            } : undefined
        });
    }
    static async notifyPayoutProcessed(instructorId, amount, userPhone, userEmail) {
        await queue_1.notificationQueue.add('PAYOUT_PROCESSED', {
            userId: instructorId,
            type: 'PAYOUT_PROCESSED',
            title: 'Payout Processed',
            body: `A payout of UGX ${amount} has been processed to your account.`,
            smsOptions: userPhone ? {
                to: userPhone,
                message: `FarmWise: A payout of UGX ${amount} has been submitted to your Stripe account. Allow a few days for processing.`
            } : undefined,
            emailOptions: userEmail ? {
                to: userEmail,
                subject: 'Payout Processed',
                html: `<p>A payout of <strong>UGX ${amount}</strong> has been successfully processed to your connected Stripe account.</p>`
            } : undefined
        });
    }
    static async notifyQAAnswer(userId, courseTitle, userPhone, userEmail) {
        await queue_1.notificationQueue.add('QA_ANSWER', {
            userId,
            type: 'QA_ANSWER',
            title: 'New Q&A Response',
            body: `Your question in ${courseTitle} has been answered.`,
            smsOptions: userPhone ? {
                to: userPhone,
                message: `FarmWise: The instructor for ${courseTitle.substring(0, 30)} answered your question. Check the app to continue learning.`
            } : undefined,
            emailOptions: userEmail ? {
                to: userEmail,
                subject: 'New Answer to Your Question',
                html: `<p>Your question in the course <strong>${courseTitle}</strong> has received a response. Open the app to read it.</p>`
            } : undefined
        });
    }
    static async notifyAnnouncement(userId, subject, message, userPhone, userEmail) {
        await queue_1.notificationQueue.add('ANNOUNCEMENT', {
            userId,
            type: 'ANNOUNCEMENT',
            title: subject,
            body: message,
            smsOptions: userPhone ? {
                to: userPhone,
                message: `FarmWise: ${subject.substring(0, 20)} - ${message.substring(0, 100)}...`
            } : undefined,
            emailOptions: userEmail ? {
                to: userEmail,
                subject: subject,
                html: `<p>${message}</p>`
            } : undefined
        });
    }
    static async notifyInstructorApplicationReviewed(userId, approved, userPhone, userEmail) {
        const status = approved ? 'approved' : 'rejected';
        await queue_1.notificationQueue.add('INSTRUCTOR_APPLICATION_REVIEWED', {
            userId,
            type: 'INSTRUCTOR_APPLICATION_REVIEWED',
            title: 'Instructor Application Update',
            body: `Your application to become a FarmWise instructor has been ${status}.`,
            smsOptions: userPhone ? {
                to: userPhone,
                message: `FarmWise: Your instructor application has been ${status}. ${approved ? 'Log in to start building your first course!' : 'Check your email for details.'}`
            } : undefined,
            emailOptions: userEmail ? {
                to: userEmail,
                subject: `Instructor Application ${approved ? 'Approved!' : 'Update'}`,
                html: `<p>Your application to become an instructor has been <strong>${status}</strong>.</p>`
            } : undefined
        });
    }
}
exports.NotificationService = NotificationService;
