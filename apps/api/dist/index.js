import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
// Walk up from cwd to find .env (handles tsx, ts-node, and direct node)
function findEnv() {
    let dir = process.cwd();
    for (let i = 0; i < 5; i++) {
        const candidate = path.join(dir, '.env');
        if (fs.existsSync(candidate))
            return candidate;
        dir = path.dirname(dir);
    }
    return '.env'; // fallback
}
dotenv.config({ path: findEnv() });
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes';
import courseRoutes from './routes/course.routes';
import instructorRoutes from './routes/instructor.routes';
import mediaRoutes from './routes/media.routes';
import paymentRoutes from './routes/payment.routes';
import enrollmentRoutes from './routes/enrollment.routes';
import learnRoutes from './routes/learn.routes';
import communityRoutes from './routes/community.routes';
import reviewRoutes from './routes/review.routes';
import adminRoutes from './routes/admin.routes';
import cartRoutes from './routes/cart.routes';
import wishlistRoutes from './routes/wishlist.routes';
import profileRoutes from './routes/profile.routes';
import statsRoutes from './routes/stats.routes';
import notificationRoutes from './routes/notification.routes';
import farmerRoutes from './routes/farmer.routes';
import pagesRoutes from './routes/pages.routes';
const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));
app.use(cookieParser());
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/instructor', instructorRoutes);
app.use('/api/v1/media', mediaRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/enrollments', enrollmentRoutes);
app.use('/api/v1/learn', learnRoutes);
app.use('/api/v1/community', communityRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/wishlist', wishlistRoutes);
app.use('/api/v1/enrollments/wishlist', wishlistRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/stats', statsRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/farmer', farmerRoutes);
app.use('/api/v1/pages', pagesRoutes);
// Start BullMQ notification worker
import('./jobs/worker').then(() => {
    console.log('Notification worker started');
}).catch(err => {
    console.warn('Notification worker failed to start (Redis may be unavailable):', err.message);
});
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`API running on port ${PORT}`);
});
