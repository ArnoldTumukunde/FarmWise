"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourseService = void 0;
const db_1 = require("@farmwise/db");
class CourseService {
    /**
     * List and search courses for the catalog.
     */
    static async listCatalog(query) {
        const { search, categoryId, level, featured, filter, rating, language, duration, sort, limit = 20, offset = 0 } = query;
        const where = {
            status: 'PUBLISHED',
        };
        if (categoryId) {
            // Include courses in this category OR any of its subcategories
            const children = await db_1.prisma.category.findMany({
                where: { parentId: categoryId },
                select: { id: true },
            });
            if (children.length > 0) {
                where.categoryId = { in: [categoryId, ...children.map(c => c.id)] };
            }
            else {
                where.categoryId = categoryId;
            }
        }
        if (level) {
            where.level = level;
        }
        if (featured) {
            where.isFeatured = true;
        }
        if (filter === 'free') {
            where.price = 0;
        }
        else if (filter === 'paid') {
            where.price = { gt: 0 };
        }
        if (rating) {
            const minRating = parseFloat(rating);
            if (!isNaN(minRating)) {
                where.averageRating = { gte: minRating };
            }
        }
        if (language) {
            where.language = { equals: language, mode: 'insensitive' };
        }
        if (duration) {
            // Duration filters: under-1h, 1-3h, 3-6h, 6h+
            const durationMap = {
                'under-1h': { lt: 3600 },
                'under-2h': { lt: 7200 },
                '1-3h': { gte: 3600, lt: 10800 },
                '3-6h': { gte: 10800, lt: 21600 },
                '6h+': { gte: 21600 },
            };
            if (durationMap[duration]) {
                where.totalDuration = durationMap[duration];
            }
        }
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }
        // Sort options
        let orderBy = { publishedAt: 'desc' };
        switch (sort) {
            case 'highest-rated':
                orderBy = { averageRating: 'desc' };
                break;
            case 'most-enrolled':
                orderBy = { reviewCount: 'desc' };
                break;
            case 'newest':
                orderBy = { publishedAt: 'desc' };
                break;
            case 'price-low':
                orderBy = { price: 'asc' };
                break;
            case 'price-high':
                orderBy = { price: 'desc' };
                break;
            // default: most-relevant (publishedAt desc)
        }
        const courses = await db_1.prisma.course.findMany({
            where,
            include: {
                instructor: {
                    select: { id: true, profile: { select: { displayName: true, avatarPublicId: true } } }
                },
                category: {
                    select: { id: true, name: true, slug: true, iconName: true }
                },
                _count: {
                    select: { reviews: true, enrollments: true, sections: true }
                }
            },
            skip: Number(offset),
            take: Number(limit),
            orderBy,
        });
        const total = await db_1.prisma.course.count({ where });
        return { data: courses, total, limit, offset };
    }
    /**
     * Get public details of a single course.
     */
    static async getPublicCourseDetails(slugOrId) {
        const isCuid = slugOrId.length > 20 && !slugOrId.includes('-'); // Rough heuristic
        const where = isCuid ? { id: slugOrId } : { slug: slugOrId };
        return db_1.prisma.course.findFirst({
            where: { ...where, status: 'PUBLISHED' },
            include: {
                instructor: {
                    select: { id: true, profile: { select: { displayName: true, avatarPublicId: true, headline: true, bio: true } } }
                },
                category: true,
                sections: {
                    orderBy: { order: 'asc' },
                    include: {
                        lectures: {
                            select: {
                                id: true, title: true, type: true, duration: true, isPreview: true, order: true
                            },
                            orderBy: { order: 'asc' }
                        }
                    }
                },
                tags: {
                    include: { tag: { select: { name: true } } }
                },
                _count: {
                    select: { reviews: true, enrollments: true }
                }
            }
        });
    }
    /**
     * Get related courses in the same category.
     */
    static async getRelatedCourses(slugOrId, limit = 8) {
        const isCuid = slugOrId.length > 20 && !slugOrId.includes('-');
        const where = isCuid ? { id: slugOrId } : { slug: slugOrId };
        const course = await db_1.prisma.course.findFirst({
            where: { ...where, status: 'PUBLISHED' },
            select: { id: true, categoryId: true },
        });
        if (!course)
            return [];
        return db_1.prisma.course.findMany({
            where: {
                status: 'PUBLISHED',
                categoryId: course.categoryId,
                id: { not: course.id },
            },
            include: {
                instructor: {
                    select: { id: true, profile: { select: { displayName: true, avatarPublicId: true } } }
                },
                category: {
                    select: { id: true, name: true, slug: true, iconName: true }
                },
                _count: {
                    select: { reviews: true, enrollments: true }
                }
            },
            orderBy: { enrollmentCount: 'desc' },
            take: limit,
        });
    }
    /**
     * Get a list of all agricultural categories for the catalog filter UI.
     */
    static async getCategories() {
        return db_1.prisma.category.findMany({
            where: { parentId: null },
            include: {
                children: {
                    orderBy: { name: 'asc' },
                },
            },
            orderBy: { name: 'asc' },
        });
    }
    /**
     * Trending courses — sorted by enrollment count in last 7 days.
     */
    static async getTrendingCourses(limit = 8) {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        // Get courses with most recent enrollments
        const recentEnrollments = await db_1.prisma.enrollment.groupBy({
            by: ['courseId'],
            where: {
                status: 'ACTIVE',
                createdAt: { gte: sevenDaysAgo },
            },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: limit,
        });
        if (recentEnrollments.length === 0) {
            // Fallback: most enrolled courses overall
            return db_1.prisma.course.findMany({
                where: { status: 'PUBLISHED' },
                include: {
                    instructor: { select: { id: true, profile: { select: { displayName: true } } } },
                    category: { select: { id: true, name: true, slug: true } },
                    _count: { select: { enrollments: true, reviews: true } },
                },
                orderBy: { enrollmentCount: 'desc' },
                take: limit,
            });
        }
        const courseIds = recentEnrollments.map(e => e.courseId);
        const courses = await db_1.prisma.course.findMany({
            where: { id: { in: courseIds }, status: 'PUBLISHED' },
            include: {
                instructor: { select: { id: true, profile: { select: { displayName: true } } } },
                category: { select: { id: true, name: true, slug: true } },
                _count: { select: { enrollments: true, reviews: true } },
            },
        });
        // Sort by the enrollment count from groupBy
        const countMap = new Map(recentEnrollments.map(e => [e.courseId, e._count.id]));
        courses.sort((a, b) => (countMap.get(b.id) || 0) - (countMap.get(a.id) || 0));
        return courses;
    }
    /**
     * Featured collection — returns a curated set of courses.
     * For now, returns the most popular courses from the newest category with courses.
     */
    static async getFeaturedCollection() {
        // Get a featured category (most enrolled)
        const topCat = await db_1.prisma.category.findFirst({
            where: { parentId: null },
            orderBy: { courses: { _count: 'desc' } },
        });
        if (!topCat)
            return null;
        const courses = await db_1.prisma.course.findMany({
            where: { categoryId: topCat.id, status: 'PUBLISHED' },
            include: {
                instructor: { select: { profile: { select: { displayName: true } } } },
                _count: { select: { enrollments: true, reviews: true } },
            },
            orderBy: { enrollmentCount: 'desc' },
            take: 7,
        });
        if (courses.length === 0)
            return null;
        const totalDuration = courses.reduce((s, c) => s + (c.totalDuration || 0), 0);
        const avgRating = courses.reduce((s, c) => s + Number(c.averageRating), 0) / courses.length;
        const totalRatings = courses.reduce((s, c) => s + c._count.reviews, 0);
        return {
            title: `Top ${topCat.name} Courses`,
            description: `Expert courses to advance your ${topCat.name.toLowerCase()} skills and grow your farm.`,
            iconName: topCat.iconName || 'Sprout',
            avgRating: Math.round(avgRating * 10) / 10,
            totalRatings,
            totalHours: Math.round(totalDuration / 3600),
            courseCount: courses.length,
            courses: courses.map(c => ({
                id: c.id, slug: c.slug, title: c.title,
                thumbnailPublicId: c.thumbnailPublicId,
                totalDuration: c.totalDuration,
            })),
        };
    }
}
exports.CourseService = CourseService;
