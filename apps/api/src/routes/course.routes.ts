import { Router } from 'express';
import { listCourses, getCourse, listCategories } from '../controllers/course.controller';

const router = Router();

router.get('/categories', listCategories);
router.get('/', listCourses);
router.get('/:idOrSlug', getCourse);

export default router;
