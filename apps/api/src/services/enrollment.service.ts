import { prisma } from '@farmwise/db';
import { NotificationService } from './notification.service';

/**
 * Resolve the effective instructor-share percent for a course at the moment of
 * purchase. Snapshotted onto the Enrollment so later admin changes don't shift
 * past earnings.
 *
 * Precedence: Course.instructorSharePercent > PlatformConfig default > 70.
 */
export async function resolveInstructorSharePercent(courseInstructorOverride: number | null | undefined): Promise<number> {
  if (courseInstructorOverride != null) {
    return Math.max(0, Math.min(100, courseInstructorOverride));
  }
  const cfg = await prisma.platformConfig.findUnique({
    where: { key: 'payments.defaultInstructorSharePercent' },
  });
  if (cfg) {
    const parsed = Number(JSON.parse(cfg.value));
    if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 100) return Math.round(parsed);
  }
  return 70;
}

export class EnrollmentService {
  /** Fast-track free-course enrollment (no Pesapal round-trip). */
  static async enrollFreeCourse(userId: string, courseId: string) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorSharePercent: true },
    });
    const sharePct = await resolveInstructorSharePercent(course?.instructorSharePercent);

    return prisma.enrollment.upsert({
      where: { userId_courseId: { userId, courseId } },
      update: { status: 'ACTIVE', paidAmount: 0 },
      create: {
        userId,
        courseId,
        paidAmount: 0,
        currency: 'UGX',
        status: 'ACTIVE',
        instructorSharePercent: sharePct,
      },
    });
  }

  static async isEnrolled(userId: string, courseId: string) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    return enrollment?.status === 'ACTIVE';
  }

  static async getUserEnrollments(userId: string) {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId, status: 'ACTIVE' },
      include: {
        course: {
          select: {
            id: true, title: true, slug: true, thumbnailPublicId: true,
            instructor: { select: { profile: { select: { displayName: true } } } },
            sections: { select: { lectures: { select: { id: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const enrollmentIds = enrollments.map((e) => e.id);
    const completedCounts = await prisma.lectureProgress.groupBy({
      by: ['enrollmentId'],
      where: { enrollmentId: { in: enrollmentIds }, isCompleted: true },
      _count: { id: true },
    });

    const completedMap = new Map(completedCounts.map((c) => [c.enrollmentId, c._count.id]));

    return enrollments.map((enrollment) => {
      const totalLectures = enrollment.course.sections.reduce((sum, s) => sum + s.lectures.length, 0);
      const completedCount = completedMap.get(enrollment.id) ?? 0;
      const progressPercent = totalLectures > 0 ? Math.round((completedCount / totalLectures) * 100) : 0;
      const { sections, ...courseWithoutSections } = enrollment.course;
      return { ...enrollment, course: courseWithoutSections, progressPercent };
    });
  }

  static async getEnrolledCourseContent(userId: string, courseIdOrSlug: string) {
    let resolvedCourseId = courseIdOrSlug;
    const isCuid = courseIdOrSlug.length > 20 && !courseIdOrSlug.includes('-');
    if (!isCuid) {
      const course = await prisma.course.findFirst({
        where: { slug: courseIdOrSlug },
        select: { id: true },
      });
      if (course) resolvedCourseId = course.id;
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: resolvedCourseId } },
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
                pdfPageCount: true,
                // videoPublicId + pdfPublicId are intentionally EXCLUDED —
                // signed URLs only, fetched on demand from /learn/lectures/:id/{download,pdf}-url
              },
            },
          },
        },
      },
    });

    const progress = await prisma.lectureProgress.findMany({
      where: { userId, enrollmentId: enrollment.id },
    });

    const completedLectureIds = progress.filter((p) => p.isCompleted).map((p) => p.lectureId);

    return {
      course,
      progress: { completedLectureIds, records: progress },
      enrollmentId: enrollment.id,
    };
  }

  /**
   * User-initiated refund request. Auto-approves if < 30 days and < 30% completed.
   * Calls Pesapal RefundRequest with the payment's confirmationCode. Refund
   * settlement is async on Pesapal's side (finance team approval), so we mark
   * REFUND_REQUESTED on the Payment row but flip Enrollment to REFUNDED right
   * away to revoke access — admin can reverse if Pesapal rejects.
   */
  static async requestRefund(userId: string, courseId: string) {
    const { PesapalService } = await import('./pesapal.service');

    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      include: {
        course: {
          select: {
            title: true,
            sections: { select: { lectures: { select: { id: true } } } },
          },
        },
        payment: { select: { id: true, confirmationCode: true, paymentMethod: true } },
      },
    });

    if (!enrollment || enrollment.status !== 'ACTIVE') {
      throw new Error('No active enrollment found');
    }

    const daysSince = (Date.now() - enrollment.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince >= 30) {
      throw new Error('Refund not eligible: enrollment is older than 30 days');
    }

    const totalLectures = enrollment.course.sections.reduce((sum, s) => sum + s.lectures.length, 0);
    if (totalLectures > 0) {
      const completedCount = await prisma.lectureProgress.count({
        where: { enrollmentId: enrollment.id, isCompleted: true },
      });
      if (completedCount / totalLectures >= 0.3) {
        throw new Error('Refund not eligible: more than 30% of lectures completed');
      }
    }

    if (enrollment.payment?.confirmationCode) {
      const result = await PesapalService.refund({
        confirmationCode: enrollment.payment.confirmationCode,
        amount: Number(enrollment.paidAmount),
        username: `user:${userId}`,
        remarks: 'Self-service refund within 30-day window',
      });
      if (!result.accepted) {
        throw new Error(`Refund rejected by Pesapal: ${result.message}`);
      }
      await prisma.payment.update({
        where: { id: enrollment.payment.id },
        data: { status: 'REFUND_REQUESTED', refundRemarks: 'auto-30day' },
      });
    }

    const updated = await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { status: 'REFUNDED', refundedAt: new Date() },
    });

    try {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { phone: true, email: true } });
      await NotificationService.notifyRefundApproved(
        userId,
        enrollment.course.title,
        Number(enrollment.paidAmount),
        user?.phone,
        user?.email,
      );
    } catch (notifyErr) {
      console.error('Failed to send refund notification:', notifyErr);
    }

    return updated;
  }
}
