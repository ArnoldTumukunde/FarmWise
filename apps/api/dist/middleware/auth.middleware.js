import jwt from 'jsonwebtoken';
import { prisma } from '@farmwise/db';
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
export const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        const user = await prisma.user.findUnique({ where: { id: payload.userId } });
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
export const requireInstructor = (req, res, next) => {
    if (!req.user || (req.user.role !== 'INSTRUCTOR' && req.user.role !== 'ADMIN')) {
        return res.status(403).json({ error: 'Instructor access required' });
    }
    next();
};
export const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};
export const requireEnrollment = async (req, res, next) => {
    if (!req.user)
        return res.status(401).json({ error: 'Unauthorized' });
    // Instructors and Admins bypass enrollment checks
    if (req.user.role === 'INSTRUCTOR' || req.user.role === 'ADMIN') {
        return next();
    }
    const courseId = req.params.courseId;
    if (!courseId)
        return res.status(400).json({ error: 'courseId parameter required' });
    const isEnrolled = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: req.user.id, courseId } }
    });
    if (!isEnrolled || isEnrolled.status !== 'ACTIVE') {
        return res.status(403).json({ error: 'You must be enrolled to access this content' });
    }
    next();
};
