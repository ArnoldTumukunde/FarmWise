"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const enrollment_controller_1 = require("../controllers/enrollment.controller");
const router = (0, express_1.Router)();
// Used by farmers to see what courses they own
router.use(auth_middleware_1.requireAuth);
router.get('/', enrollment_controller_1.getMyEnrollments);
router.post('/enroll/:courseId', enrollment_controller_1.enrollFree);
router.get('/:courseId/content', enrollment_controller_1.getEnrolledContent);
router.post('/:courseId/refund', enrollment_controller_1.requestRefund);
exports.default = router;
