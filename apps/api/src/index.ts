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

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({
  verify: (req: any, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(cookieParser());

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/instructor', instructorRoutes);
app.use('/api/v1/instructor/media', mediaRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/enrollments', enrollmentRoutes);
app.use('/api/v1/learn', learnRoutes);
app.use('/api/v1/community', communityRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/admin', adminRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`API running on port ${PORT}`);
});
