import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { EnrollmentService } from '../services/enrollment.service';

export const getMyEnrollments = async (req: AuthRequest, res: Response) => {
  try {
    const enrollments = await EnrollmentService.getUserEnrollments(req.user!.id);
    res.json({ enrollments });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getEnrolledContent = async (req: AuthRequest, res: Response) => {
  try {
    const courseId = req.params.courseId;
    const content = await EnrollmentService.getEnrolledCourseContent(req.user!.id, courseId);
    res.json(content);
  } catch (error: any) {
    res.status(403).json({ error: error.message });
  }
};
