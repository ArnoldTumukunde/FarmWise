import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification } from '../controllers/notification.controller';

const router = Router();
router.get('/', requireAuth, getNotifications);
router.get('/unread-count', requireAuth, getUnreadCount);
router.post('/read-all', requireAuth, markAllAsRead);
router.post('/:id/read', requireAuth, markAsRead);
router.delete('/:id', requireAuth, deleteNotification);
export default router;
