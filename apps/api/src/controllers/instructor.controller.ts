import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { InstructorService } from '../services/instructor.service';
import { prisma } from '@farmwise/db';

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
    // Whitelist allowed fields to prevent Prisma unknown field errors
    const allowed = [
      'title', 'subtitle', 'description', 'price', 'level', 'language',
      'outcomes', 'requirements', 'thumbnailPublicId', 'previewVideoPublicId',
      'isOfflineEnabled', 'isFeatured',
    ];
    const data: Record<string, any> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    }
    const course = await InstructorService.updateCourse(req.user!.id, req.params.courseId, data);
    res.json({ course });
  } catch (error: any) {
    res.status(403).json({ error: error.message });
  }
};

export const updateSection = async (req: AuthRequest, res: Response) => {
  try {
    const section = await InstructorService.updateSection(req.params.sectionId, req.user!.id, req.body);
    res.json({ section });
  } catch (error: any) {
    res.status(403).json({ error: error.message });
  }
};

export const updateLecture = async (req: AuthRequest, res: Response) => {
  try {
    const lecture = await InstructorService.updateLecture(req.params.lectureId, req.user!.id, req.body);
    res.json({ lecture });
  } catch (error: any) {
    res.status(403).json({ error: error.message });
  }
};

export const deleteSection = async (req: AuthRequest, res: Response) => {
  try {
    await InstructorService.deleteSection(req.params.sectionId, req.user!.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(403).json({ error: error.message });
  }
};

export const deleteLecture = async (req: AuthRequest, res: Response) => {
  try {
    await InstructorService.deleteLecture(req.params.lectureId, req.user!.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(403).json({ error: error.message });
  }
};

export const deleteCourse = async (req: AuthRequest, res: Response) => {
  try {
    await InstructorService.deleteCourse(req.params.courseId, req.user!.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getCourseAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const analytics = await InstructorService.getCourseAnalytics(req.params.courseId, req.user!.id);
    res.json({ analytics });
  } catch (error: any) {
    res.status(403).json({ error: error.message });
  }
};

export const submitForReview = async (req: AuthRequest, res: Response) => {
  try {
    const course = await InstructorService.submitForReview(req.params.courseId, req.user!.id);
    res.json({ course });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
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

export const getApplicationStatus = async (req: AuthRequest, res: Response) => {
  try {
    const application = await prisma.instructorApplication.findFirst({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ application });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const submitApplication = async (req: AuthRequest, res: Response) => {
  try {
    const { motivation, expertise } = req.body;

    if (!motivation || !expertise || !Array.isArray(expertise)) {
      return res.status(400).json({ error: 'motivation (string) and expertise (string[]) are required' });
    }

    const application = await InstructorService.submitApplication(req.user!.id, motivation, expertise);
    res.json({ application });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const analytics = await InstructorService.getAnalytics(req.user!.id);
    res.json({ analytics });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const reorderSections = async (req: AuthRequest, res: Response) => {
  try {
    const { sectionIds } = req.body;

    if (!sectionIds || !Array.isArray(sectionIds)) {
      return res.status(400).json({ error: 'sectionIds (string[]) is required' });
    }

    await InstructorService.reorderSections(req.user!.id, req.params.courseId, sectionIds);
    res.json({ success: true });
  } catch (error: any) {
    res.status(403).json({ error: error.message });
  }
};

export const reorderLectures = async (req: AuthRequest, res: Response) => {
  try {
    const { lectureIds } = req.body;

    if (!lectureIds || !Array.isArray(lectureIds)) {
      return res.status(400).json({ error: 'lectureIds (string[]) is required' });
    }

    await InstructorService.reorderLectures(req.user!.id, req.params.sectionId, lectureIds);
    res.json({ success: true });
  } catch (error: any) {
    res.status(403).json({ error: error.message });
  }
};

// Accepts sectionId in body instead of URL params (used by CourseBuilder frontend)
export const reorderLecturesByCourse = async (req: AuthRequest, res: Response) => {
  try {
    const { sectionId, lectureIds } = req.body;

    if (!sectionId || !lectureIds || !Array.isArray(lectureIds)) {
      return res.status(400).json({ error: 'sectionId (string) and lectureIds (string[]) are required' });
    }

    await InstructorService.reorderLectures(req.user!.id, sectionId, lectureIds);
    res.json({ success: true });
  } catch (error: any) {
    res.status(403).json({ error: error.message });
  }
};
