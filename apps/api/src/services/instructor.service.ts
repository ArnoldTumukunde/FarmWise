import { prisma, Course, Section, Lecture, Prisma } from '@farmwise/db';
import { sanitizeRichText } from '../utils/sanitize';

export class InstructorService {
  static async listInstructorCourses(instructorId: string) {
    return prisma.course.findMany({
      where: { instructorId },
      include: {
        category: true,
        _count: { select: { enrollments: true, reviews: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async createCourse(instructorId: string, data: {
    title: string;
    categoryId: string;
    subtitle?: string;
    level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ALL_LEVELS';
    language?: string;
    outcomes?: string[];
    requirements?: string[];
    price?: number;
  }) {
    if (!data.title?.trim()) throw new Error('Title required');
    if (!data.categoryId) throw new Error('Category required');

    // Verify category exists
    const cat = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!cat) throw new Error('Invalid category');

    // Generate unique slug from title + random suffix
    const baseSlug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    let slug = `${baseSlug}-${Math.random().toString(36).substring(2, 8)}`;
    for (let i = 0; i < 3; i++) {
      const existing = await prisma.course.findUnique({ where: { slug } });
      if (!existing) break;
      slug = `${baseSlug}-${Math.random().toString(36).substring(2, 8)}`;
    }

    return prisma.course.create({
      data: {
        title: data.title.trim(),
        slug,
        description: '',
        subtitle: data.subtitle,
        categoryId: data.categoryId,
        instructorId,
        level: (data.level as any) || 'BEGINNER',
        language: data.language || 'English',
        outcomes: data.outcomes || [],
        requirements: data.requirements || [],
        price: data.price ?? 0,
      },
      include: {
        category: true,
        _count: { select: { enrollments: true, reviews: true } },
      },
    });
  }

  static async getCourseDraft(instructorId: string, courseId: string) {
    const course = await prisma.course.findFirst({
      where: { id: courseId, instructorId },
      include: {
        category: true,
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
                isPreview: true,
                videoPublicId: true,
                videoStatus: true,
                duration: true,
                content: true,
                quizData: true,
              },
            },
          },
        },
      },
    });
    if (!course) throw new Error('Course not found or access denied');
    return course;
  }

  static async updateCourse(instructorId: string, courseId: string, data: Prisma.CourseUpdateInput) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course || course.instructorId !== instructorId) {
      throw new Error('Course not found or access denied');
    }

    if (typeof data.description === 'string') {
      data.description = sanitizeRichText(data.description);
    }

    return prisma.course.update({
      where: { id: courseId },
      data,
      include: {
        sections: {
          orderBy: { order: 'asc' },
          include: { lectures: { orderBy: { order: 'asc' } } },
        },
        category: true,
      },
    });
  }

  /**
   * Update a section's title. Verifies instructor ownership via section->course->instructorId.
   */
  static async updateSection(sectionId: string, instructorId: string, data: { title: string }) {
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      include: { course: true },
    });
    if (!section || section.course.instructorId !== instructorId) {
      throw new Error('Section not found or access denied');
    }

    return prisma.section.update({
      where: { id: sectionId },
      data: { title: data.title },
    });
  }

  /**
   * Update a lecture's metadata. Verifies instructor ownership via lecture->section->course->instructorId.
   */
  static async updateLecture(
    lectureId: string,
    instructorId: string,
    data: {
      title?: string;
      type?: 'VIDEO' | 'ARTICLE' | 'QUIZ';
      isPreview?: boolean;
      duration?: number;
      videoPublicId?: string;
      content?: string;
      quizData?: any;
    }
  ) {
    const lecture = await prisma.lecture.findUnique({
      where: { id: lectureId },
      include: { section: { include: { course: true } } },
    });
    if (!lecture || lecture.section.course.instructorId !== instructorId) {
      throw new Error('Lecture not found or access denied');
    }

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.isPreview !== undefined) updateData.isPreview = data.isPreview;
    if (data.duration !== undefined) updateData.duration = data.duration;
    if (data.videoPublicId !== undefined) {
      updateData.videoPublicId = data.videoPublicId;
      updateData.videoStatus = 'PROCESSING'; // Will be set to READY by Cloudinary webhook
    }
    if (data.content !== undefined) updateData.content = data.content;
    if (data.quizData !== undefined) updateData.quizData = data.quizData;

    return prisma.lecture.update({
      where: { id: lectureId },
      data: updateData,
    });
  }

  /**
   * Delete a section (CASCADE deletes lectures). Verifies instructor ownership.
   */
  static async deleteSection(sectionId: string, instructorId: string) {
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      include: { course: true },
    });
    if (!section || section.course.instructorId !== instructorId) {
      throw new Error('Section not found or access denied');
    }

    await prisma.section.delete({ where: { id: sectionId } });
    return { success: true };
  }

  /**
   * Delete a lecture. Verifies instructor ownership.
   */
  static async deleteLecture(lectureId: string, instructorId: string) {
    const lecture = await prisma.lecture.findUnique({
      where: { id: lectureId },
      include: { section: { include: { course: true } } },
    });
    if (!lecture || lecture.section.course.instructorId !== instructorId) {
      throw new Error('Lecture not found or access denied');
    }

    await prisma.lecture.delete({ where: { id: lectureId } });
    return { success: true };
  }

  /**
   * Delete a course. Only allowed if there are no ACTIVE enrollments. Verifies instructor ownership.
   */
  static async deleteCourse(courseId: string, instructorId: string) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course || course.instructorId !== instructorId) {
      throw new Error('Course not found or access denied');
    }

    const activeEnrollments = await prisma.enrollment.count({
      where: { courseId, status: 'ACTIVE' },
    });
    if (activeEnrollments > 0) {
      throw new Error('Cannot delete course with active enrollments');
    }

    await prisma.course.delete({ where: { id: courseId } });
    return { success: true };
  }

  /**
   * Get detailed analytics for a single course. Verifies instructor ownership.
   */
  static async getCourseAnalytics(courseId: string, instructorId: string) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course || course.instructorId !== instructorId) {
      throw new Error('Course not found or access denied');
    }

    // Total enrollments
    const totalEnrollments = await prisma.enrollment.count({
      where: { courseId, status: 'ACTIVE' },
    });

    // Total revenue
    const revenueResult = await prisma.enrollment.aggregate({
      where: { courseId, status: 'ACTIVE' },
      _sum: { paidAmount: true },
    });
    const totalRevenue = Number(revenueResult._sum.paidAmount ?? 0);

    // Average rating and review count
    const ratingResult = await prisma.review.aggregate({
      where: { courseId, isHidden: false },
      _avg: { rating: true },
      _count: { rating: true },
    });
    const averageRating = Number(ratingResult._avg.rating ?? 0);
    const reviewCount = ratingResult._count.rating;

    // Enrollment trend: last 30 days grouped by day
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const enrollmentTrend: Array<{ date: string; count: bigint }> = await prisma.$queryRaw`
      SELECT DATE("createdAt") as date, COUNT(*)::bigint as count
      FROM "Enrollment"
      WHERE "courseId" = ${courseId}
        AND status = 'ACTIVE'
        AND "createdAt" >= ${thirtyDaysAgo}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    // Lecture completion rates (single query instead of N+1)
    const lectures = await prisma.lecture.findMany({
      where: { section: { courseId } },
      select: { id: true, title: true },
    });

    const lectureIds = lectures.map(l => l.id);
    const progressStats = await prisma.lectureProgress.groupBy({
      by: ['lectureId'],
      where: { lectureId: { in: lectureIds } },
      _count: { _all: true },
    });
    const completedStats = await prisma.lectureProgress.groupBy({
      by: ['lectureId'],
      where: { lectureId: { in: lectureIds }, isCompleted: true },
      _count: { _all: true },
    });

    const totalMap = new Map(progressStats.map(s => [s.lectureId, s._count._all]));
    const completedMap = new Map(completedStats.map(s => [s.lectureId, s._count._all]));

    const completionRates = lectures.map((lecture) => {
      const totalStarted = totalMap.get(lecture.id) || 0;
      const totalCompleted = completedMap.get(lecture.id) || 0;
      return {
        lectureId: lecture.id,
        title: lecture.title,
        totalStarted,
        totalCompleted,
        completionRate: totalStarted > 0 ? Math.round((totalCompleted / totalStarted) * 100) : 0,
      };
    });

    return {
      courseTitle: course.title,
      totalEnrollments,
      totalRevenue,
      averageRating,
      reviewCount,
      enrollmentTrend: enrollmentTrend.map((row) => ({
        date: String(row.date),
        count: Number(row.count),
      })),
      lectureCompletionRates: completionRates,
    };
  }

  /**
   * Submit a course for review. Only allowed if currently DRAFT.
   */
  static async submitForReview(courseId: string, instructorId: string) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course || course.instructorId !== instructorId) {
      throw new Error('Course not found or access denied');
    }
    if (course.status !== 'DRAFT') {
      throw new Error('Only DRAFT courses can be submitted for review');
    }

    return prisma.course.update({
      where: { id: courseId },
      data: { status: 'UNDER_REVIEW' },
    });
  }

  /** ADMIN-only: directly publish or unpublish a course without review. */
  static async setStatus(courseId: string, userId: string, userRole: string, status: 'DRAFT' | 'PUBLISHED') {
    if (userRole !== 'ADMIN') throw new Error('Only admins can directly change publish status');
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new Error('Course not found');
    return prisma.course.update({
      where: { id: courseId },
      data: {
        status,
        ...(status === 'PUBLISHED' && !course.publishedAt ? { publishedAt: new Date() } : {}),
      },
    });
  }

  static async createSection(instructorId: string, courseId: string, title: string) {
    const course = await prisma.course.findUnique({ where: { id: courseId }, include: { sections: true } });
    if (!course || course.instructorId !== instructorId) throw new Error('Access denied');

    const order = course.sections.length;
    return prisma.section.create({
      data: { courseId, title, order }
    });
  }

  static async createLecture(instructorId: string, sectionId: string, title: string, type: 'VIDEO' | 'ARTICLE' | 'QUIZ') {
    const section = await prisma.section.findUnique({ where: { id: sectionId }, include: { course: true, lectures: true } });
    if (!section || section.course.instructorId !== instructorId) throw new Error('Access denied');

    const order = section.lectures.length;
    return prisma.lecture.create({
      data: { sectionId, title, type, order }
    });
  }

  /**
   * Submit an instructor application.
   */
  static async submitApplication(userId: string, motivation: string, expertise: string[]) {
    // Check no PENDING application exists for this user
    const existing = await prisma.instructorApplication.findFirst({
      where: { userId, status: 'PENDING' },
    });

    if (existing) {
      throw new Error('You already have a pending instructor application');
    }

    return prisma.instructorApplication.create({
      data: { userId, motivation, expertise },
    });
  }

  /**
   * Get analytics for an instructor's courses.
   */
  static async getAnalytics(instructorId: string) {
    // Total enrollments across all courses
    const totalEnrollments = await prisma.enrollment.count({
      where: {
        course: { instructorId },
        status: 'ACTIVE',
      },
    });

    // Total revenue (sum of paidAmount from ACTIVE enrollments)
    const revenueResult = await prisma.enrollment.aggregate({
      where: {
        course: { instructorId },
        status: 'ACTIVE',
      },
      _sum: { paidAmount: true },
    });
    const totalRevenue = revenueResult._sum.paidAmount ?? 0;

    // Average rating across courses
    const ratingResult = await prisma.course.aggregate({
      where: { instructorId, status: 'PUBLISHED' },
      _avg: { averageRating: true },
    });
    const averageRating = ratingResult._avg.averageRating ?? 0;

    // Total offline downloads
    const totalDownloads = await prisma.offlineDownload.count({
      where: {
        enrollment: {
          course: { instructorId },
        },
        status: 'DOWNLOADED',
      },
    });

    // This month vs last month revenue
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const thisMonthRev = await prisma.enrollment.aggregate({
      where: {
        course: { instructorId },
        status: 'ACTIVE',
        createdAt: { gte: startOfThisMonth },
      },
      _sum: { paidAmount: true },
    });

    const lastMonthRev = await prisma.enrollment.aggregate({
      where: {
        course: { instructorId },
        status: 'ACTIVE',
        createdAt: { gte: startOfLastMonth, lt: startOfThisMonth },
      },
      _sum: { paidAmount: true },
    });

    // Recent enrollments for activity feed
    const recentEnrollmentsRaw = await prisma.enrollment.findMany({
      where: { course: { instructorId }, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: { include: { profile: true } },
        course: { select: { title: true } },
      },
    });

    const recentEnrollments = recentEnrollmentsRaw.map((e) => {
      const name = e.user.profile?.displayName || (e.user.email ? e.user.email.split('@')[0] : e.user.phone) || 'Student';
      const parts = name.split(' ');
      const short = parts.length > 1 ? `${parts[0]} ${parts[1][0]}.` : parts[0];
      const ms = Date.now() - new Date(e.createdAt).getTime();
      const mins = Math.floor(ms / 60000);
      let timeAgo = 'just now';
      if (mins >= 1440) timeAgo = `${Math.floor(mins / 1440)} day${Math.floor(mins / 1440) > 1 ? 's' : ''} ago`;
      else if (mins >= 60) timeAgo = `${Math.floor(mins / 60)} hour${Math.floor(mins / 60) > 1 ? 's' : ''} ago`;
      else if (mins >= 1) timeAgo = `${mins} min${mins > 1 ? 's' : ''} ago`;
      return { studentName: short, courseTitle: e.course.title, timeAgo };
    });

    // Unanswered Q&A count
    const instructorLectures = await prisma.lecture.findMany({
      where: { section: { course: { instructorId } } },
      select: { id: true }
    });
    const lectureIds = instructorLectures.map(l => l.id);

    const unansweredQACount = await prisma.question.count({
      where: {
        lectureId: { in: lectureIds },
        answers: { none: {} },
      },
    });

    // Monthly revenue breakdown (last 12 months)
    const revenueByMonth: { month: string; total: number; net: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const monthRev = await prisma.enrollment.aggregate({
        where: {
          course: { instructorId },
          status: 'ACTIVE',
          createdAt: { gte: start, lt: end },
        },
        _sum: { paidAmount: true },
      });
      const total = Number(monthRev._sum.paidAmount ?? 0);
      revenueByMonth.push({
        month: start.toLocaleString('en', { month: 'short' }),
        total,
        net: Math.round(total * 0.7), // 70% after platform fee
      });
    }

    return {
      totalEnrollments,
      totalRevenue: Number(totalRevenue),
      averageRating: Number(averageRating),
      totalDownloads,
      thisMonthRevenue: Number(thisMonthRev._sum.paidAmount ?? 0),
      lastMonthRevenue: Number(lastMonthRev._sum.paidAmount ?? 0),
      recentEnrollments,
      unansweredQACount,
      revenueByMonth,
    };
  }

  /**
   * Reorder sections within a course.
   */
  static async reorderSections(instructorId: string, courseId: string, sectionIds: string[]) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course || course.instructorId !== instructorId) {
      throw new Error('Course not found or access denied');
    }

    // Update order for each section in a transaction
    await prisma.$transaction(
      sectionIds.map((id, index) =>
        prisma.section.update({
          where: { id },
          data: { order: index },
        })
      )
    );

    return { success: true };
  }

  /**
   * Reorder lectures within a section.
   */
  static async reorderLectures(instructorId: string, sectionId: string, lectureIds: string[]) {
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      include: { course: true },
    });
    if (!section || section.course.instructorId !== instructorId) {
      throw new Error('Section not found or access denied');
    }

    // Update order for each lecture in a transaction
    await prisma.$transaction(
      lectureIds.map((id, index) =>
        prisma.lecture.update({
          where: { id },
          data: { order: index },
        })
      )
    );

    return { success: true };
  }
}
