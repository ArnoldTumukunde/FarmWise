"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const course_controller_1 = require("../controllers/course.controller");
const router = (0, express_1.Router)();
router.get('/categories', course_controller_1.listCategories);
router.get('/trending', course_controller_1.getTrendingCourses);
router.get('/collections/featured', course_controller_1.getFeaturedCollection);
router.get('/', course_controller_1.listCourses);
router.get('/:idOrSlug/related', course_controller_1.getRelatedCourses);
router.get('/:idOrSlug', course_controller_1.getCourse);
// Public preview URL for preview lectures (no auth required)
router.post('/lectures/:lectureId/preview-url', course_controller_1.getPreviewUrl);
exports.default = router;
