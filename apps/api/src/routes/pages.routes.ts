import { Router, Request, Response } from 'express';
import { CmsService } from '../services/cms.service';

const router = Router();

// Public: get published page by slug
router.get('/:slug', async (req: Request, res: Response) => {
    try {
        const page = await CmsService.getPage(req.params.slug);
        if (!page || !page.isPublished) return res.status(404).json({ error: 'Page not found' });
        res.json({ page });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Public: get homepage sections config
router.get('/homepage/sections', async (_req: Request, res: Response) => {
    try {
        const sections = await CmsService.getHomepageSections();
        // Only return enabled sections to the public
        res.json({ sections: sections.filter(s => s.enabled) });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
