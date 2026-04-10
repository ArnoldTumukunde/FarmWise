"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuditLogs = exports.deletePage = exports.updatePage = exports.createPage = exports.getPage = exports.listPages = exports.reorderHomepageSections = exports.updateHomepageSection = exports.getHomepageSections = void 0;
const cms_service_1 = require("../services/cms.service");
// ─── HOMEPAGE SECTIONS ────────────────────────────────────────────
const getHomepageSections = async (req, res) => {
    try {
        const sections = await cms_service_1.CmsService.getHomepageSections();
        res.json({ sections });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
};
exports.getHomepageSections = getHomepageSections;
const updateHomepageSection = async (req, res) => {
    try {
        const section = await cms_service_1.CmsService.updateHomepageSection(req.params.key, req.body);
        await cms_service_1.CmsService.log(req.user.id, 'homepage.updateSection', 'HomepageSection', req.params.key, req.body, req.ip);
        res.json({ section });
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
};
exports.updateHomepageSection = updateHomepageSection;
const reorderHomepageSections = async (req, res) => {
    try {
        const { keys } = req.body;
        if (!Array.isArray(keys))
            return res.status(400).json({ error: 'keys must be an array' });
        await cms_service_1.CmsService.reorderHomepageSections(keys);
        await cms_service_1.CmsService.log(req.user.id, 'homepage.reorder', 'HomepageSection', undefined, { keys }, req.ip);
        const sections = await cms_service_1.CmsService.getHomepageSections();
        res.json({ sections });
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
};
exports.reorderHomepageSections = reorderHomepageSections;
// ─── STATIC PAGES ─────────────────────────────────────────────────
const listPages = async (req, res) => {
    try {
        const pages = await cms_service_1.CmsService.listPages(true);
        res.json({ pages });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
};
exports.listPages = listPages;
const getPage = async (req, res) => {
    try {
        const page = await cms_service_1.CmsService.getPageById(req.params.id);
        if (!page)
            return res.status(404).json({ error: 'Page not found' });
        res.json({ page });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
};
exports.getPage = getPage;
const createPage = async (req, res) => {
    try {
        const { slug, title, content, isPublished, metaTitle, metaDesc } = req.body;
        if (!slug || !title)
            return res.status(400).json({ error: 'slug and title are required' });
        const page = await cms_service_1.CmsService.createPage({ slug, title, content: content || '', isPublished, metaTitle, metaDesc });
        await cms_service_1.CmsService.log(req.user.id, 'page.create', 'Page', page.id, { slug, title }, req.ip);
        res.status(201).json({ page });
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
};
exports.createPage = createPage;
const updatePage = async (req, res) => {
    try {
        const page = await cms_service_1.CmsService.updatePage(req.params.id, req.body);
        await cms_service_1.CmsService.log(req.user.id, 'page.update', 'Page', page.id, req.body, req.ip);
        res.json({ page });
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
};
exports.updatePage = updatePage;
const deletePage = async (req, res) => {
    try {
        await cms_service_1.CmsService.deletePage(req.params.id);
        await cms_service_1.CmsService.log(req.user.id, 'page.delete', 'Page', req.params.id, undefined, req.ip);
        res.json({ message: 'Page deleted' });
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
};
exports.deletePage = deletePage;
// ─── AUDIT LOG ────────────────────────────────────────────────────
const getAuditLogs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const action = req.query.action;
        const adminId = req.query.adminId;
        const entity = req.query.entity;
        const result = await cms_service_1.CmsService.getAuditLogs(page, limit, { action, adminId, entity });
        res.json(result);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
};
exports.getAuditLogs = getAuditLogs;
