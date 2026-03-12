import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { InstructorService } from '../services/instructor.service';

export const listCourses = async (req: AuthRequest, res: Response) => {
  try {
    const courses = await InstructorService.listInstructorCourses(req.user!.id);
    res.json({ courses });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createCourse = async (req: AuthRequest, res: Response) => {
  try {
    const course = await InstructorService.createCourse(req.user!.id, req.body);
    res.json({ course });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getCourse = async (req: AuthRequest, res: Response) => {
  try {
    const course = await InstructorService.getCourseDraft(req.user!.id, req.params.courseId);
    res.json({ course });
  } catch (error: any) {
    res.status(403).json({ error: error.message });
  }
};

export const updateCourse = async (req: AuthRequest, res: Response) => {
  try {
    const course = await InstructorService.updateCourse(req.user!.id, req.params.courseId, req.body);
    res.json({ course });
  } catch (error: any) {
    res.status(403).json({ error: error.message });
  }
};

export const createSection = async (req: AuthRequest, res: Response) => {
  try {
    const section = await InstructorService.createSection(req.user!.id, req.params.courseId, req.body.title);
    res.json({ section });
  } catch (error: any) {
    res.status(403).json({ error: error.message });
  }
};

export const createLecture = async (req: AuthRequest, res: Response) => {
  try {
    const lecture = await InstructorService.createLecture(req.user!.id, req.params.sectionId, req.body.title, req.body.type);
    res.json({ lecture });
  } catch (error: any) {
    res.status(403).json({ error: error.message });
  }
};
