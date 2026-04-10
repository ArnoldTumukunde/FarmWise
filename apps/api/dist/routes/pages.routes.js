"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cms_service_1 = require("../services/cms.service");
const router = (0, express_1.Router)();
// Public: get published page by slug
router.get('/:slug', async (req, res) => {
    try {
        const page = await cms_service_1.CmsService.getPage(req.params.slug);
        if (!page || !page.isPublished)
            return res.status(404).json({ error: 'Page not found' });
        res.json({ page });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// Public: get homepage sections config
router.get('/homepage/sections', async (_req, res) => {
    try {
        const sections = await cms_service_1.CmsService.getHomepageSections();
        // Only return enabled sections to the public
        res.json({ sections: sections.filter(s => s.enabled) });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
exports.default = router;
