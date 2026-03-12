import { prisma, Course, Prisma } from '@farmwise/db';

export class CourseService {
    /**
     * List and search courses for the catalog.
     */
    static async listCatalog(query: {
        search?: string;
        categoryId?: string;
        level?: string;
        limit?: number;
        offset?: number;
    }) {
        const { search, categoryId, level, limit = 20, offset = 0 } = query;

        const where: Prisma.CourseWhereInput = {
            status: 'PUBLISHED',
        };

        if (categoryId) {
            where.categoryId = categoryId;
        }

        if (level) {
            where.level = level as any;
        }

        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        const courses = await prisma.course.findMany({
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
            orderBy: { publishedAt: 'desc' }
        });

        const total = await prisma.course.count({ where });

        return { data: courses, total, limit, offset };
    }

    /**
     * Get public details of a single course.
     */
    static async getPublicCourseDetails(slugOrId: string) {
        const isCuid = slugOrId.length > 20 && !slugOrId.includes('-'); // Rough heuristic
        const where = isCuid ? { id: slugOrId } : { slug: slugOrId };

        return prisma.course.findFirst({
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
                _count: {
                    select: { reviews: true, enrollments: true }
                }
            }
        });
    }

    /**
     * Get a list of all agricultural categories for the catalog filter UI.
     */
    static async getCategories() {
        return prisma.category.findMany({
            orderBy: { name: 'asc' }
        });
    }
}
