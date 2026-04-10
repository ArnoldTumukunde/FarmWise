"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeFromWishlist = exports.addToWishlist = exports.getWishlist = void 0;
const db_1 = require("@farmwise/db");
const getWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const items = await db_1.prisma.wishlist.findMany({
            where: { userId },
            include: {
                course: {
                    select: {
                        id: true,
                        slug: true,
                        title: true,
                        price: true,
                        thumbnailPublicId: true,
                        averageRating: true,
                        instructor: {
                            select: {
                                id: true,
                                profile: { select: { displayName: true } },
                            },
                        },
                        _count: { select: { enrollments: true, reviews: true } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        const courses = items.map((item) => ({
            ...item.course,
            instructor: {
                ...item.course.instructor,
                profile: item.course.instructor.profile || { displayName: 'Instructor' },
            },
        }));
        res.json({ wishlist: courses });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getWishlist = getWishlist;
const addToWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const { courseId } = req.params;
        // Verify course exists
        const course = await db_1.prisma.course.findUnique({ where: { id: courseId } });
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }
        await db_1.prisma.wishlist.upsert({
            where: { userId_courseId: { userId, courseId } },
            create: { userId, courseId },
            update: {},
        });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.addToWishlist = addToWishlist;
const removeFromWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const { courseId } = req.params;
        await db_1.prisma.wishlist.deleteMany({
            where: { userId, courseId },
        });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.removeFromWishlist = removeFromWishlist;
