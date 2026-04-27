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
    const { displayName, username, headline, bio, farmLocation, cropSpecialities, primaryCrops, farmSize, yearsExperience, website, avatarPublicId } = req.body;
    const crops = cropSpecialities ?? primaryCrops;

    // Validate username if provided: 3-20 chars, lowercase letters/numbers/underscore
    let cleanUsername: string | null | undefined = undefined;
    if (username !== undefined) {
      if (username === null || username === '') {
        cleanUsername = null;
      } else if (typeof username === 'string') {
        const u = username.trim().toLowerCase();
        if (!/^[a-z0-9_]{3,20}$/.test(u)) {
          return res.status(400).json({ error: 'Username must be 3-20 chars: lowercase letters, numbers, underscore' });
        }
        cleanUsername = u;
      }
    }

    const profile = await ProfileService.updateMyProfile(req.user!.id, {
      displayName,
      username: cleanUsername,
      headline,
      bio,
      farmLocation,
      cropSpecialities: crops,
      farmSize,
      yearsExperience: yearsExperience === '' || yearsExperience == null ? null : Number(yearsExperience),
      website,
      avatarPublicId,
    });
    res.json({ profile });
  } catch (error: any) {
    if (error?.code === 'P2002' && error?.meta?.target?.includes('username')) {
      return res.status(409).json({ error: 'Username already taken' });
    }
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
