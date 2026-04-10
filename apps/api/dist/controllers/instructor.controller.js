"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reorderLecturesByCourse = exports.reorderLectures = exports.reorderSections = exports.getAnalytics = exports.submitApplication = exports.getApplicationStatus = exports.createLecture = exports.createSection = exports.submitForReview = exports.getCourseAnalytics = exports.deleteCourse = exports.deleteLecture = exports.deleteSection = exports.updateLecture = exports.updateSection = exports.updateCourse = exports.getCourse = exports.createCourse = exports.listCourses = void 0;
const instructor_service_1 = require("../services/instructor.service");
const db_1 = require("@farmwise/db");
const listCourses = async (req, res) => {
    try {
        const courses = await instructor_service_1.InstructorService.listInstructorCourses(req.user.id);
        res.json({ courses });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.listCourses = listCourses;
const createCourse = async (req, res) => {
    try {
        const course = await instructor_service_1.InstructorService.createCourse(req.user.id, req.body);
        res.json({ course });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.createCourse = createCourse;
const getCourse = async (req, res) => {
    try {
        const course = await instructor_service_1.InstructorService.getCourseDraft(req.user.id, req.params.courseId);
        res.json({ course });
    }
    catch (error) {
        res.status(403).json({ error: error.message });
    }
};
exports.getCourse = getCourse;
const updateCourse = async (req, res) => {
    try {
        // Whitelist allowed fields to prevent Prisma unknown field errors
        const allowed = [
            'title', 'subtitle', 'description', 'price', 'level', 'language',
            'outcomes', 'requirements', 'thumbnailPublicId', 'previewVideoPublicId',
            'isOfflineEnabled', 'isFeatured',
        ];
        const data = {};
        for (const key of allowed) {
            if (req.body[key] !== undefined)
                data[key] = req.body[key];
        }
        const course = await instructor_service_1.InstructorService.updateCourse(req.user.id, req.params.courseId, data);
        res.json({ course });
    }
    catch (error) {
        res.status(403).json({ error: error.message });
    }
};
exports.updateCourse = updateCourse;
const updateSection = async (req, res) => {
    try {
        const section = await instructor_service_1.InstructorService.updateSection(req.params.sectionId, req.user.id, req.body);
        res.json({ section });
    }
    catch (error) {
        res.status(403).json({ error: error.message });
    }
};
exports.updateSection = updateSection;
const updateLecture = async (req, res) => {
    try {
        const lecture = await instructor_service_1.InstructorService.updateLecture(req.params.lectureId, req.user.id, req.body);
        res.json({ lecture });
    }
    catch (error) {
        res.status(403).json({ error: error.message });
    }
};
exports.updateLecture = updateLecture;
const deleteSection = async (req, res) => {
    try {
        await instructor_service_1.InstructorService.deleteSection(req.params.sectionId, req.user.id);
        res.json({ success: true });
    }
    catch (error) {
        res.status(403).json({ error: error.message });
    }
};
exports.deleteSection = deleteSection;
const deleteLecture = async (req, res) => {
    try {
        await instructor_service_1.InstructorService.deleteLecture(req.params.lectureId, req.user.id);
        res.json({ success: true });
    }
    catch (error) {
        res.status(403).json({ error: error.message });
    }
};
exports.deleteLecture = deleteLecture;
const deleteCourse = async (req, res) => {
    try {
        await instructor_service_1.InstructorService.deleteCourse(req.params.courseId, req.user.id);
        res.json({ success: true });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.deleteCourse = deleteCourse;
const getCourseAnalytics = async (req, res) => {
    try {
        const analytics = await instructor_service_1.InstructorService.getCourseAnalytics(req.params.courseId, req.user.id);
        res.json({ analytics });
    }
    catch (error) {
        res.status(403).json({ error: error.message });
    }
};
exports.getCourseAnalytics = getCourseAnalytics;
const submitForReview = async (req, res) => {
    try {
        const course = await instructor_service_1.InstructorService.submitForReview(req.params.courseId, req.user.id);
        res.json({ course });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.submitForReview = submitForReview;
const createSection = async (req, res) => {
    try {
        const section = await instructor_service_1.InstructorService.createSection(req.user.id, req.params.courseId, req.body.title);
        res.json({ section });
    }
    catch (error) {
        res.status(403).json({ error: error.message });
    }
};
exports.createSection = createSection;
const createLecture = async (req, res) => {
    try {
        const lecture = await instructor_service_1.InstructorService.createLecture(req.user.id, req.params.sectionId, req.body.title, req.body.type);
        res.json({ lecture });
    }
    catch (error) {
        res.status(403).json({ error: error.message });
    }
};
exports.createLecture = createLecture;
const getApplicationStatus = async (req, res) => {
    try {
        const application = await db_1.prisma.instructorApplication.findFirst({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ application });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getApplicationStatus = getApplicationStatus;
const submitApplication = async (req, res) => {
    try {
        const { motivation, expertise } = req.body;
        if (!motivation || !expertise || !Array.isArray(expertise)) {
            return res.status(400).json({ error: 'motivation (string) and expertise (string[]) are required' });
        }
        const application = await instructor_service_1.InstructorService.submitApplication(req.user.id, motivation, expertise);
        res.json({ application });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.submitApplication = submitApplication;
const getAnalytics = async (req, res) => {
    try {
        const analytics = await instructor_service_1.InstructorService.getAnalytics(req.user.id);
        res.json({ analytics });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getAnalytics = getAnalytics;
const reorderSections = async (req, res) => {
    try {
        const { sectionIds } = req.body;
        if (!sectionIds || !Array.isArray(sectionIds)) {
            return res.status(400).json({ error: 'sectionIds (string[]) is required' });
        }
        await instructor_service_1.InstructorService.reorderSections(req.user.id, req.params.courseId, sectionIds);
        res.json({ success: true });
    }
    catch (error) {
        res.status(403).json({ error: error.message });
    }
};
exports.reorderSections = reorderSections;
const reorderLectures = async (req, res) => {
    try {
        const { lectureIds } = req.body;
        if (!lectureIds || !Array.isArray(lectureIds)) {
            return res.status(400).json({ error: 'lectureIds (string[]) is required' });
        }
        await instructor_service_1.InstructorService.reorderLectures(req.user.id, req.params.sectionId, lectureIds);
        res.json({ success: true });
    }
    catch (error) {
        res.status(403).json({ error: error.message });
    }
};
exports.reorderLectures = reorderLectures;
// Accepts sectionId in body instead of URL params (used by CourseBuilder frontend)
const reorderLecturesByCourse = async (req, res) => {
    try {
        const { sectionId, lectureIds } = req.body;
        if (!sectionId || !lectureIds || !Array.isArray(lectureIds)) {
            return res.status(400).json({ error: 'sectionId (string) and lectureIds (string[]) are required' });
        }
        await instructor_service_1.InstructorService.reorderLectures(req.user.id, sectionId, lectureIds);
        res.json({ success: true });
    }
    catch (error) {
        res.status(403).json({ error: error.message });
    }
};
exports.reorderLecturesByCourse = reorderLecturesByCourse;
