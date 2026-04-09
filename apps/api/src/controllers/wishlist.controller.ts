import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '@farmwise/db';

export const getWishlist = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const items = await prisma.wishlist.findMany({
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
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const addToWishlist = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { courseId } = req.params;

    // Verify course exists
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    await prisma.wishlist.upsert({
      where: { userId_courseId: { userId, courseId } },
      create: { userId, courseId },
      update: {},
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const removeFromWishlist = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { courseId } = req.params;

    await prisma.wishlist.deleteMany({
      where: { userId, courseId },
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
