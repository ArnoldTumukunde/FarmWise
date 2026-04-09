import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { CmsService } from '../services/cms.service';

// ─── HOMEPAGE SECTIONS ────────────────────────────────────────────

export const getHomepageSections = async (req: AuthRequest, res: Response) => {
    try {
        const sections = await CmsService.getHomepageSections();
        res.json({ sections });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
};

export const updateHomepageSection = async (req: AuthRequest, res: Response) => {
    try {
        const section = await CmsService.updateHomepageSection(req.params.key, req.body);
        await CmsService.log(req.user!.id, 'homepage.updateSection', 'HomepageSection', req.params.key, req.body, req.ip);
        res.json({ section });
    } catch (e: any) { res.status(400).json({ error: e.message }); }
};

export const reorderHomepageSections = async (req: AuthRequest, res: Response) => {
    try {
        const { keys } = req.body;
        if (!Array.isArray(keys)) return res.status(400).json({ error: 'keys must be an array' });
        await CmsService.reorderHomepageSections(keys);
        await CmsService.log(req.user!.id, 'homepage.reorder', 'HomepageSection', undefined, { keys }, req.ip);
        const sections = await CmsService.getHomepageSections();
        res.json({ sections });
    } catch (e: any) { res.status(400).json({ error: e.message }); }
};

// ─── STATIC PAGES ─────────────────────────────────────────────────

export const listPages = async (req: AuthRequest, res: Response) => {
    try {
        const pages = await CmsService.listPages(true);
        res.json({ pages });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
};

export const getPage = async (req: AuthRequest, res: Response) => {
    try {
        const page = await CmsService.getPageById(req.params.id);
        if (!page) return res.status(404).json({ error: 'Page not found' });
        res.json({ page });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
};

export const createPage = async (req: AuthRequest, res: Response) => {
    try {
        const { slug, title, content, isPublished, metaTitle, metaDesc } = req.body;
        if (!slug || !title) return res.status(400).json({ error: 'slug and title are required' });
        const page = await CmsService.createPage({ slug, title, content: content || '', isPublished, metaTitle, metaDesc });
        await CmsService.log(req.user!.id, 'page.create', 'Page', page.id, { slug, title }, req.ip);
        res.status(201).json({ page });
    } catch (e: any) { res.status(400).json({ error: e.message }); }
};

export const updatePage = async (req: AuthRequest, res: Response) => {
    try {
        const page = await CmsService.updatePage(req.params.id, req.body);
        await CmsService.log(req.user!.id, 'page.update', 'Page', page.id, req.body, req.ip);
        res.json({ page });
    } catch (e: any) { res.status(400).json({ error: e.message }); }
};

export const deletePage = async (req: AuthRequest, res: Response) => {
    try {
        await CmsService.deletePage(req.params.id);
        await CmsService.log(req.user!.id, 'page.delete', 'Page', req.params.id, undefined, req.ip);
        res.json({ message: 'Page deleted' });
    } catch (e: any) { res.status(400).json({ error: e.message }); }
};

// ─── AUDIT LOG ────────────────────────────────────────────────────

export const getAuditLogs = async (req: AuthRequest, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const action = req.query.action as string | undefined;
        const adminId = req.query.adminId as string | undefined;
        const entity = req.query.entity as string | undefined;
        const result = await CmsService.getAuditLogs(page, limit, { action, adminId, entity });
        res.json(result);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
};
