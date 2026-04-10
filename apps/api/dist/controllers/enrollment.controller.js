"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestRefund = exports.getEnrolledContent = exports.getMyEnrollments = exports.enrollFree = void 0;
const enrollment_service_1 = require("../services/enrollment.service");
const db_1 = require("@farmwise/db");
const enrollFree = async (req, res) => {
    try {
        const { courseId } = req.params;
        const course = await db_1.prisma.course.findUnique({ where: { id: courseId }, select: { price: true } });
        if (!course)
            return res.status(404).json({ error: 'Course not found' });
        if (Number(course.price) > 0)
            return res.status(400).json({ error: 'This course is not free' });
        const enrollment = await enrollment_service_1.EnrollmentService.enrollFreeCourse(req.user.id, courseId);
        res.json({ success: true, enrollment });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.enrollFree = enrollFree;
const getMyEnrollments = async (req, res) => {
    try {
        const enrollments = await enrollment_service_1.EnrollmentService.getUserEnrollments(req.user.id);
        res.json({ enrollments });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getMyEnrollments = getMyEnrollments;
const getEnrolledContent = async (req, res) => {
    try {
        const courseId = req.params.courseId;
        const content = await enrollment_service_1.EnrollmentService.getEnrolledCourseContent(req.user.id, courseId);
        res.json(content);
    }
    catch (error) {
        res.status(403).json({ error: error.message });
    }
};
exports.getEnrolledContent = getEnrolledContent;
const requestRefund = async (req, res) => {
    try {
        const { courseId } = req.params;
        const enrollment = await enrollment_service_1.EnrollmentService.requestRefund(req.user.id, courseId);
        res.json({ success: true, enrollment });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.requestRefund = requestRefund;
