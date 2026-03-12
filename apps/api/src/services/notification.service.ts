import { NotificationType } from '@prisma/client';
import { notificationQueue } from '../jobs/queue';

export class NotificationService {
    static async notifyEnrollmentConfirmed(userId: string, courseTitle: string, userPhone?: string | null, userEmail?: string | null) {
        await notificationQueue.add('ENROLLMENT_CONFIRMED', {
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

    static async notifyReviewReceived(instructorId: string, courseTitle: string, rating: number, userPhone?: string | null, userEmail?: string | null) {
        await notificationQueue.add('REVIEW_RECEIVED', {
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

    static async notifyCertificateEarned(userId: string, courseTitle: string, userPhone?: string | null, userEmail?: string | null) {
        await notificationQueue.add('CERTIFICATE_EARNED', {
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

    static async notifyRefundApproved(userId: string, courseTitle: string, amount: number, userPhone?: string | null, userEmail?: string | null) {
         await notificationQueue.add('REFUND_APPROVED', {
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
}
