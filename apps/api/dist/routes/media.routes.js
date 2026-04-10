"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const media_controller_1 = require("../controllers/media.controller");
const rate_limit_middleware_1 = require("../middleware/rate-limit.middleware");
const router = (0, express_1.Router)();
// /sign — avatar uploads open to all authenticated users; course media needs instructor
router.get('/sign', auth_middleware_1.requireAuth, rate_limit_middleware_1.cloudinarySignatureLimiter, media_controller_1.getUploadSignature);
router.post('/sign', auth_middleware_1.requireAuth, rate_limit_middleware_1.cloudinarySignatureLimiter, media_controller_1.getUploadSignature);
// Webhooks must be public (Cloudinary calls them)
router.post('/video-ready', media_controller_1.handleVideoReadyWebhook);
exports.default = router;
