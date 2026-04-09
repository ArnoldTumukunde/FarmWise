import { Request, Response } from 'express';
import { CourseService } from '../services/course.service';
import { prisma } from '@farmwise/db';
import { storageService } from '../services/cloudinary.service';

export const listCourses = async (req: Request, res: Response) => {
    try {
        const result = await CourseService.listCatalog(req.query);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getCourse = async (req: Request, res: Response) => {
    try {
        const { idOrSlug } = req.params;
        const course = await CourseService.getPublicCourseDetails(idOrSlug);
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }
        res.json({ course });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const listCategories = async (req: Request, res: Response) => {
    try {
        const categories = await CourseService.getCategories();
        res.json({ categories });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getRelatedCourses = async (req: Request, res: Response) => {
    try {
        const { idOrSlug } = req.params;
        const courses = await CourseService.getRelatedCourses(idOrSlug);
        res.json({ courses });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Public endpoint: get a signed video URL for a preview lecture.
 * No authentication required — only works for lectures marked as isPreview.
 */
export const getTrendingCourses = async (req: Request, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || 8;
        const courses = await CourseService.getTrendingCourses(limit);
        res.json({ courses });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getFeaturedCollection = async (req: Request, res: Response) => {
    try {
        const collection = await CourseService.getFeaturedCollection();
        res.json(collection);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getPreviewUrl = async (req: Request, res: Response) => {
    try {
        const { lectureId } = req.params;
        const lecture = await prisma.lecture.findUnique({
            where: { id: lectureId },
        });

        if (!lecture) {
            return res.status(404).json({ error: 'Lecture not found' });
        }

        if (!lecture.isPreview) {
            return res.status(403).json({ error: 'This lecture is not available for preview' });
        }

        if (!lecture.videoPublicId) {
            return res.status(404).json({ error: 'No video available for this lecture' });
        }

        const url = storageService.getSignedVideoUrl(lecture.videoPublicId, 300);
        res.json({ url });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
