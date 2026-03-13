import { Router } from 'express';
import { listCourses, getCourse, listCategories, getPreviewUrl } from '../controllers/course.controller';

const router = Router();

router.get('/categories', listCategories);
router.get('/', listCourses);
router.get('/:idOrSlug', getCourse);
// Public preview URL for preview lectures (no auth required)
router.post('/lectures/:lectureId/preview-url', getPreviewUrl);

export default router;
