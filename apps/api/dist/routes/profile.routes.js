"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const profile_service_1 = require("../services/profile.service");
const router = (0, express_1.Router)();
// GET /profile - get current user's profile
router.get('/', auth_middleware_1.requireAuth, async (req, res) => {
    try {
        const profile = await profile_service_1.ProfileService.getMyProfile(req.user.id);
        res.json({ profile });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// PUT /profile - update current user's profile
router.put('/', auth_middleware_1.requireAuth, async (req, res) => {
    try {
        const { displayName, headline, bio, farmLocation, cropSpecialities, website, avatarPublicId } = req.body;
        const profile = await profile_service_1.ProfileService.updateMyProfile(req.user.id, {
            displayName,
            headline,
            bio,
            farmLocation,
            cropSpecialities,
            website,
            avatarPublicId,
        });
        res.json({ profile });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// GET /profile/:userId - get another user's public profile
router.get('/:userId', async (req, res) => {
    try {
        const profile = await profile_service_1.ProfileService.getPublicProfile(req.params.userId);
        res.json({ profile });
    }
    catch (error) {
        res.status(404).json({ error: error.message });
    }
});
exports.default = router;
