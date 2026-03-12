import { Router } from 'express';
import { requireAuth, requireInstructor } from '../middleware/auth.middleware';
import {
  listCourses,
  createCourse,
  getCourse,
  updateCourse,
  createSection,
  createLecture
} from '../controllers/instructor.controller';

const router = Router();

// All instructor routes require authentication and instructor role
router.use(requireAuth, requireInstructor);

router.get('/courses', listCourses);
router.post('/courses', createCourse);
router.get('/courses/:courseId', getCourse);
router.patch('/courses/:courseId', updateCourse);
router.post('/courses/:courseId/sections', createSection);
router.post('/sections/:sectionId/lectures', createLecture);

export default router;
