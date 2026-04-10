"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireEnrollment = exports.requireAdmin = exports.requireInstructor = exports.requireAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("@farmwise/db");
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const user = await db_1.prisma.user.findUnique({ where: { id: payload.userId } });
        if (!user) {
            return res.status(401).json({ error: 'User no longer exists' });
        }
        req.user = { id: user.id, role: user.role };
        next();
    }
    catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};
exports.requireAuth = requireAuth;
const requireInstructor = (req, res, next) => {
    if (!req.user || (req.user.role !== 'INSTRUCTOR' && req.user.role !== 'ADMIN')) {
        return res.status(403).json({ error: 'Instructor access required' });
    }
    next();
};
exports.requireInstructor = requireInstructor;
const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};
exports.requireAdmin = requireAdmin;
const requireEnrollment = async (req, res, next) => {
    if (!req.user)
        return res.status(401).json({ error: 'Unauthorized' });
    // Instructors and Admins bypass enrollment checks
    if (req.user.role === 'INSTRUCTOR' || req.user.role === 'ADMIN') {
        return next();
    }
    const courseId = req.params.courseId;
    if (!courseId)
        return res.status(400).json({ error: 'courseId parameter required' });
    const isEnrolled = await db_1.prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: req.user.id, courseId } }
    });
    if (!isEnrolled || isEnrolled.status !== 'ACTIVE') {
        return res.status(403).json({ error: 'You must be enrolled to access this content' });
    }
    next();
};
exports.requireEnrollment = requireEnrollment;
