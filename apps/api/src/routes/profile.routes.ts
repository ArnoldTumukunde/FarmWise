import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth.middleware';
import { ProfileService } from '../services/profile.service';

const router = Router();

// GET /profile - get current user's profile
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const profile = await ProfileService.getMyProfile(req.user!.id);
    res.json({ profile });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /profile - update current user's profile
router.put('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { displayName, headline, bio, farmLocation, cropSpecialities, website, avatarPublicId } = req.body;
    const profile = await ProfileService.updateMyProfile(req.user!.id, {
      displayName,
      headline,
      bio,
      farmLocation,
      cropSpecialities,
      website,
      avatarPublicId,
    });
    res.json({ profile });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /profile/:userId - get another user's public profile
router.get('/:userId', async (req: AuthRequest, res: Response) => {
  try {
    const profile = await ProfileService.getPublicProfile(req.params.userId);
    res.json({ profile });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

export default router;
