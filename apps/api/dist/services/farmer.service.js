import { prisma } from '@farmwise/db';
export class FarmerService {
    /**
     * Weekly learning progress for the streak/goal widget.
     */
    static async getWeeklyProgress(userId) {
        // Find Monday of this week
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ...
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() + mondayOffset);
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(now);
        todayEnd.setHours(23, 59, 59, 999);
        // Get all progress entries this week
        const weekProgress = await prisma.lectureProgress.findMany({
            where: {
                userId,
                lastWatchedAt: { gte: weekStart, lte: weekEnd },
            },
            select: { watchedSeconds: true, lastWatchedAt: true },
        });
        // Today's minutes
        const todaySeconds = weekProgress
            .filter(p => p.lastWatchedAt && p.lastWatchedAt >= todayStart && p.lastWatchedAt <= todayEnd)
            .reduce((sum, p) => sum + p.watchedSeconds, 0);
        const minutesTodayWatched = Math.round(todaySeconds / 60);
        // Days this week with activity — group by date
        const activeDates = new Set();
        for (const p of weekProgress) {
            if (p.lastWatchedAt) {
                activeDates.add(p.lastWatchedAt.toISOString().slice(0, 10));
            }
        }
        const daysThisWeekActive = activeDates.size;
        // Current streak: count consecutive days backward from today
        let currentStreakDays = 0;
        const checkDate = new Date(todayStart);
        for (let i = 0; i < 365; i++) {
            const dateStr = checkDate.toISOString().slice(0, 10);
            const hasActivity = await prisma.lectureProgress.count({
                where: {
                    userId,
                    lastWatchedAt: {
                        gte: new Date(dateStr + 'T00:00:00.000Z'),
                        lte: new Date(dateStr + 'T23:59:59.999Z'),
                    },
                },
            });
            if (hasActivity > 0) {
                currentStreakDays++;
                checkDate.setDate(checkDate.getDate() - 1);
            }
            else if (i === 0) {
                // Today hasn't had activity yet, check yesterday
                checkDate.setDate(checkDate.getDate() - 1);
                continue;
            }
            else {
                break;
            }
        }
        return {
            currentStreakDays,
            minutesTodayWatched,
            dailyGoalMinutes: 30,
            daysThisWeekActive,
            weeklyGoalDays: 5,
            weekStartDate: weekStart.toISOString().slice(0, 10),
            weekEndDate: weekEnd.toISOString().slice(0, 10),
        };
    }
    /**
     * Homepage recommendations: top category + "because you viewed".
     */
    static async getHomepageRecommendations(userId) {
        // Find user's most-enrolled category
        const enrollments = await prisma.enrollment.findMany({
            where: { userId, status: 'ACTIVE' },
            include: { course: { select: { categoryId: true } } },
        });
        // Count enrollments per category
        const categoryCounts = new Map();
        for (const e of enrollments) {
            if (e.course.categoryId) {
                categoryCounts.set(e.course.categoryId, (categoryCounts.get(e.course.categoryId) || 0) + 1);
            }
        }
        let topCategory = null;
        if (categoryCounts.size > 0) {
            const topCatId = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];
            const enrolledCourseIds = enrollments.map(e => e.courseId);
            const cat = await prisma.category.findUnique({ where: { id: topCatId } });
            const courses = await prisma.course.findMany({
                where: {
                    categoryId: topCatId,
                    status: 'PUBLISHED',
                    id: { notIn: enrolledCourseIds },
                },
                include: {
                    instructor: { select: { profile: { select: { displayName: true } } } },
                    _count: { select: { enrollments: true, reviews: true } },
                },
                orderBy: { averageRating: 'desc' },
                take: 8,
            });
            if (cat) {
                topCategory = {
                    name: cat.name,
                    slug: cat.slug,
                    courses: courses.map(c => ({
                        id: c.id, slug: c.slug, title: c.title, subtitle: c.subtitle,
                        thumbnailPublicId: c.thumbnailPublicId, price: Number(c.price),
                        averageRating: Number(c.averageRating), reviewCount: c._count.reviews,
                        level: c.level, language: c.language, updatedAt: c.updatedAt,
                        totalDuration: c.totalDuration, isFeatured: c.isFeatured,
                        instructor: { name: c.instructor?.profile?.displayName || 'Instructor' },
                        _count: c._count,
                    })),
                };
            }
        }
        return { topCategory, becauseYouViewed: null };
    }
    /**
     * "Because you enrolled in X" — related courses from same category.
     */
    static async getBecauseYouEnrolled(userId, courseId, limit = 8) {
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: { categoryId: true },
        });
        if (!course?.categoryId)
            return [];
        const enrolledIds = (await prisma.enrollment.findMany({
            where: { userId, status: 'ACTIVE' },
            select: { courseId: true },
        })).map(e => e.courseId);
        return prisma.course.findMany({
            where: {
                categoryId: course.categoryId,
                status: 'PUBLISHED',
                id: { notIn: enrolledIds },
            },
            include: {
                instructor: { select: { profile: { select: { displayName: true } } } },
                _count: { select: { enrollments: true, reviews: true } },
            },
            orderBy: { averageRating: 'desc' },
            take: limit,
        });
    }
    /**
     * Recommended topics based on enrolled categories.
     */
    static async getRecommendedTopics(userId, limit = 10) {
        const enrollments = await prisma.enrollment.findMany({
            where: { userId, status: 'ACTIVE' },
            include: {
                course: {
                    select: {
                        category: { select: { name: true } },
                        tags: { select: { tag: { select: { name: true } } } },
                    },
                },
            },
        });
        const topicSet = new Set();
        for (const e of enrollments) {
            if (e.course.category?.name)
                topicSet.add(e.course.category.name);
            for (const t of e.course.tags)
                topicSet.add(t.tag.name);
        }
        // If not enough topics, add popular categories
        if (topicSet.size < limit) {
            const cats = await prisma.category.findMany({
                where: { parentId: null },
                select: { name: true },
                take: limit,
            });
            for (const c of cats)
                topicSet.add(c.name);
        }
        return [...topicSet].slice(0, limit);
    }
    /**
     * Farmer stats for dashboard.
     */
    static async getStats(userId) {
        const enrollments = await prisma.enrollment.findMany({
            where: { userId, status: 'ACTIVE' },
            include: {
                course: {
                    select: {
                        sections: { select: { lectures: { select: { id: true } } } },
                    },
                },
            },
        });
        const enrollmentCount = enrollments.length;
        // Hours learned
        const totalWatched = await prisma.lectureProgress.aggregate({
            where: { userId },
            _sum: { watchedSeconds: true },
        });
        const hoursLearned = Math.round((totalWatched._sum.watchedSeconds || 0) / 3600 * 10) / 10;
        // Completed courses
        let completedCount = 0;
        for (const enrollment of enrollments) {
            const totalLectures = enrollment.course.sections.reduce((sum, s) => sum + s.lectures.length, 0);
            if (totalLectures === 0)
                continue;
            const completed = await prisma.lectureProgress.count({
                where: { enrollmentId: enrollment.id, isCompleted: true },
            });
            if (completed >= totalLectures)
                completedCount++;
        }
        // Certificate count (completed courses)
        const certificateCount = completedCount;
        return { enrollmentCount, hoursLearned, certificateCount, completedCount };
    }
}
