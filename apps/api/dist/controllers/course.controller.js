"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPreviewUrl = exports.getFeaturedCollection = exports.getTrendingCourses = exports.getRelatedCourses = exports.listCategories = exports.getCourse = exports.listCourses = void 0;
const course_service_1 = require("../services/course.service");
const db_1 = require("@farmwise/db");
const cloudinary_service_1 = require("../services/cloudinary.service");
const listCourses = async (req, res) => {
    try {
        const result = await course_service_1.CourseService.listCatalog(req.query);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.listCourses = listCourses;
const getCourse = async (req, res) => {
    try {
        const { idOrSlug } = req.params;
        const course = await course_service_1.CourseService.getPublicCourseDetails(idOrSlug);
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }
        res.json({ course });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getCourse = getCourse;
const listCategories = async (req, res) => {
    try {
        const categories = await course_service_1.CourseService.getCategories();
        res.json({ categories });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.listCategories = listCategories;
const getRelatedCourses = async (req, res) => {
    try {
        const { idOrSlug } = req.params;
        const courses = await course_service_1.CourseService.getRelatedCourses(idOrSlug);
        res.json({ courses });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getRelatedCourses = getRelatedCourses;
/**
 * Public endpoint: get a signed video URL for a preview lecture.
 * No authentication required — only works for lectures marked as isPreview.
 */
const getTrendingCourses = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 8;
        const courses = await course_service_1.CourseService.getTrendingCourses(limit);
        res.json({ courses });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getTrendingCourses = getTrendingCourses;
const getFeaturedCollection = async (req, res) => {
    try {
        const collection = await course_service_1.CourseService.getFeaturedCollection();
        res.json(collection);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getFeaturedCollection = getFeaturedCollection;
const getPreviewUrl = async (req, res) => {
    try {
        const { lectureId } = req.params;
        const lecture = await db_1.prisma.lecture.findUnique({
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
        const url = cloudinary_service_1.storageService.getSignedVideoUrl(lecture.videoPublicId, 300);
        res.json({ url });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getPreviewUrl = getPreviewUrl;
