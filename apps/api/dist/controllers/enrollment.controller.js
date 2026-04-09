import { EnrollmentService } from '../services/enrollment.service';
import { prisma } from '@farmwise/db';
export const enrollFree = async (req, res) => {
    try {
        const { courseId } = req.params;
        const course = await prisma.course.findUnique({ where: { id: courseId }, select: { price: true } });
        if (!course)
            return res.status(404).json({ error: 'Course not found' });
        if (Number(course.price) > 0)
            return res.status(400).json({ error: 'This course is not free' });
        const enrollment = await EnrollmentService.enrollFreeCourse(req.user.id, courseId);
        res.json({ success: true, enrollment });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
export const getMyEnrollments = async (req, res) => {
    try {
        const enrollments = await EnrollmentService.getUserEnrollments(req.user.id);
        res.json({ enrollments });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
export const getEnrolledContent = async (req, res) => {
    try {
        const courseId = req.params.courseId;
        const content = await EnrollmentService.getEnrolledCourseContent(req.user.id, courseId);
        res.json(content);
    }
    catch (error) {
        res.status(403).json({ error: error.message });
    }
};
export const requestRefund = async (req, res) => {
    try {
        const { courseId } = req.params;
        const enrollment = await EnrollmentService.requestRefund(req.user.id, courseId);
        res.json({ success: true, enrollment });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
