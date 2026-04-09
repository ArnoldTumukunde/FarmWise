import { Router } from 'express';
import { requireAuth, requireInstructor } from '../middleware/auth.middleware';
import { listCourses, createCourse, getCourse, updateCourse, updateSection, updateLecture, deleteSection, deleteLecture, deleteCourse, getCourseAnalytics, submitForReview, createSection, createLecture, submitApplication, getApplicationStatus, getAnalytics, reorderSections, reorderLectures, reorderLecturesByCourse } from '../controllers/instructor.controller';
const router = Router();
// Application endpoints - any authenticated user can apply / check status
router.post('/apply', requireAuth, submitApplication);
router.get('/application-status', requireAuth, getApplicationStatus);
// All remaining instructor routes require authentication and instructor role
router.use(requireAuth, requireInstructor);
router.get('/analytics', getAnalytics);
router.get('/courses', listCourses);
router.post('/courses', createCourse);
router.get('/courses/:courseId', getCourse);
router.patch('/courses/:courseId', updateCourse);
router.put('/courses/:courseId', updateCourse);
router.delete('/courses/:courseId', deleteCourse);
router.get('/courses/:courseId/analytics', getCourseAnalytics);
router.put('/courses/:courseId/status', submitForReview);
router.post('/courses/:courseId/sections', createSection);
router.put('/courses/:courseId/sections/reorder', reorderSections);
router.put('/courses/:courseId/sections/:sectionId', updateSection);
router.delete('/courses/:courseId/sections/:sectionId', deleteSection);
router.put('/courses/:courseId/lectures/:lectureId', updateLecture);
router.delete('/courses/:courseId/lectures/:lectureId', deleteLecture);
router.post('/sections/:sectionId/lectures', createLecture);
router.put('/sections/:sectionId/lectures/reorder', reorderLectures);
router.put('/courses/:courseId/reorder-lectures', reorderLecturesByCourse);
export default router;
