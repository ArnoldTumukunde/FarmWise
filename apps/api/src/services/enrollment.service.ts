import { prisma } from '@farmwise/db';
import Stripe from 'stripe';

export class EnrollmentService {
  /**
   * Activates an enrollment after a successful Stripe checkout session.
   */
  static async activateEnrollment(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;
    const courseId = session.metadata?.courseId;
    const paidAmount = session.amount_total ? session.amount_total / 100 : 0;
    const paymentId = session.payment_intent as string;

    if (!userId || !courseId) {
      console.error("Missing metadata in Stripe session", session.id);
      return;
    }

    await prisma.enrollment.upsert({
      where: {
        userId_courseId: { userId, courseId }
      },
      update: {
        status: 'ACTIVE',
        paidAmount,
        paymentId
      },
      create: {
        userId,
        courseId,
        paidAmount,
        paymentId,
        status: 'ACTIVE'
      }
    });

    // TODO: BullMQ queues for Email & SMS confirm
  }

  /**
   * Fast-track enrollment for free courses without Stripe.
   */
  static async enrollFreeCourse(userId: string, courseId: string) {
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
  static async isEnrolled(userId: string, courseId: string) {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: { userId, courseId }
      }
    });
    return enrollment?.status === 'ACTIVE';
  }

  static async getUserEnrollments(userId: string) {
    return prisma.enrollment.findMany({
      where: { userId, status: 'ACTIVE' },
      include: {
        course: {
          select: {
            id: true, title: true, slug: true, thumbnailPublicId: true,
            instructor: { select: { profile: { select: { displayName: true } } } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getEnrolledCourseContent(userId: string, courseId: string) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } }
    });
    if (!enrollment || enrollment.status !== 'ACTIVE') {
      throw new Error('Not enrolled');
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: { select: { profile: { select: { displayName: true } } } },
        sections: {
          orderBy: { order: 'asc' },
          include: {
            lectures: {
              orderBy: { order: 'asc' },
              select: {
                id: true, title: true, type: true, duration: true, isPreview: true, order: true
                // Note: videoPublicId is EXCLUDED to satisfy hard constraint
              }
            }
          }
        }
      }
    });

    const progress = await prisma.lectureProgress.findMany({
      where: { userId, enrollmentId: enrollment.id }
    });

    return { course, progress };
  }
}
