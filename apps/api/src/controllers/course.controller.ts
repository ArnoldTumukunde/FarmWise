import { Request, Response } from 'express';
import { CourseService } from '../services/course.service';

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
