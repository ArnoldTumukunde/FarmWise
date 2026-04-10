"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const learn_controller_1 = require("../controllers/learn.controller");
const rate_limit_middleware_1 = require("../middleware/rate-limit.middleware");
const router = (0, express_1.Router)();
// Apply auth to all learn routes automatically
router.use(auth_middleware_1.requireAuth);
router.post('/lectures/:lectureId/download-url', rate_limit_middleware_1.downloadUrlLimiter, learn_controller_1.getDownloadUrl);
router.post('/downloads', learn_controller_1.recordDownload);
router.delete('/downloads/:lectureId', learn_controller_1.recordDownloadDeletion);
router.post('/progress/sync', learn_controller_1.syncProgress);
exports.default = router;
