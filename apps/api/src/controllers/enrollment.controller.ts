import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { EnrollmentService } from '../services/enrollment.service';
import { prisma } from '@farmwise/db';

export const enrollFree = async (req: AuthRequest, res: Response) => {
  try {
    const { courseId } = req.params;
    const course = await prisma.course.findUnique({ where: { id: courseId }, select: { price: true } });
    if (!course) return res.status(404).json({ error: 'Course not found' });
    if (Number(course.price) > 0) return res.status(400).json({ error: 'This course is not free' });

    const enrollment = await EnrollmentService.enrollFreeCourse(req.user!.id, courseId);
    res.json({ success: true, enrollment });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getMyEnrollments = async (req: AuthRequest, res: Response) => {
  try {
    const archived = req.query.archived === 'true';
    const enrollments = await EnrollmentService.getUserEnrollments(req.user!.id, { archived });
    res.json({ enrollments });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const archiveEnrollment = async (req: AuthRequest, res: Response) => {
  try {
    const enrollment = await EnrollmentService.setArchived(req.user!.id, req.params.id, true);
    res.json({ success: true, enrollment });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
};

export const unarchiveEnrollment = async (req: AuthRequest, res: Response) => {
  try {
    const enrollment = await EnrollmentService.setArchived(req.user!.id, req.params.id, false);
    res.json({ success: true, enrollment });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
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

export const requestRefund = async (req: AuthRequest, res: Response) => {
  try {
    const { courseId } = req.params;
    const enrollment = await EnrollmentService.requestRefund(req.user!.id, courseId);
    res.json({ success: true, enrollment });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
