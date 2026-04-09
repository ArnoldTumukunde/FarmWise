import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth.middleware';
import { FarmerService } from '../services/farmer.service';

const router = Router();
router.use(requireAuth);

// GET /farmer/weekly-progress
router.get('/weekly-progress', async (req: AuthRequest, res: Response) => {
  try {
    const data = await FarmerService.getWeeklyProgress(req.user!.id);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /farmer/homepage-recommendations
router.get('/homepage-recommendations', async (req: AuthRequest, res: Response) => {
  try {
    const data = await FarmerService.getHomepageRecommendations(req.user!.id);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /farmer/because-you-enrolled?courseId=&limit=8
router.get('/because-you-enrolled', async (req: AuthRequest, res: Response) => {
  try {
    const courseId = req.query.courseId as string;
    const limit = parseInt(req.query.limit as string) || 8;
    if (!courseId) return res.status(400).json({ error: 'courseId required' });
    const courses = await FarmerService.getBecauseYouEnrolled(req.user!.id, courseId, limit);
    res.json({ courses });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /farmer/recommended-topics?limit=10
router.get('/recommended-topics', async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const topics = await FarmerService.getRecommendedTopics(req.user!.id, limit);
    res.json({ topics });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /farmer/stats
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const stats = await FarmerService.getStats(req.user!.id);
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
