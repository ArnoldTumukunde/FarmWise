"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const farmer_service_1 = require("../services/farmer.service");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.requireAuth);
// GET /farmer/weekly-progress
router.get('/weekly-progress', async (req, res) => {
    try {
        const data = await farmer_service_1.FarmerService.getWeeklyProgress(req.user.id);
        res.json(data);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// GET /farmer/homepage-recommendations
router.get('/homepage-recommendations', async (req, res) => {
    try {
        const data = await farmer_service_1.FarmerService.getHomepageRecommendations(req.user.id);
        res.json(data);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// GET /farmer/because-you-enrolled?courseId=&limit=8
router.get('/because-you-enrolled', async (req, res) => {
    try {
        const courseId = req.query.courseId;
        const limit = parseInt(req.query.limit) || 8;
        if (!courseId)
            return res.status(400).json({ error: 'courseId required' });
        const courses = await farmer_service_1.FarmerService.getBecauseYouEnrolled(req.user.id, courseId, limit);
        res.json({ courses });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// GET /farmer/recommended-topics?limit=10
router.get('/recommended-topics', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const topics = await farmer_service_1.FarmerService.getRecommendedTopics(req.user.id, limit);
        res.json({ topics });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// GET /farmer/stats
router.get('/stats', async (req, res) => {
    try {
        const stats = await farmer_service_1.FarmerService.getStats(req.user.id);
        res.json(stats);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.default = router;
