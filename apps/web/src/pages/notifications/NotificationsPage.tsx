import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchApi } from '@/lib/api';
import { toast } from 'sonner';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Loader2,
  ShoppingCart,
  BookOpen,
  Star,
  MessageSquare,
  Award,
  Megaphone,
  XCircle,
  DollarSign,
  HelpCircle,
} from 'lucide-react';

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'ENROLLMENT_CONFIRMED':
      return <BookOpen className="h-5 w-5 text-[#2E7D32]" />;
    case 'REVIEW_RECEIVED':
    case 'REVIEW_RESPONSE':
      return <Star className="h-5 w-5 text-[#F57F17]" />;
    case 'REFUND_APPROVED':
    case 'PAYOUT_PROCESSED':
      return <DollarSign className="h-5 w-5 text-[#2E7D32]" />;
    case 'COURSE_APPROVED':
      return <Check className="h-5 w-5 text-[#2E7D32]" />;
    case 'COURSE_REJECTED':
      return <XCircle className="h-5 w-5 text-red-500" />;
    case 'QA_ANSWER':
      return <MessageSquare className="h-5 w-5 text-blue-500" />;
    case 'CERTIFICATE_EARNED':
      return <Award className="h-5 w-5 text-[#F57F17]" />;
    case 'ANNOUNCEMENT':
      return <Megaphone className="h-5 w-5 text-[#5A6E5A]" />;
    case 'INSTRUCTOR_APPLICATION_REVIEWED':
      return <BookOpen className="h-5 w-5 text-[#2E7D32]" />;
    default:
      return <HelpCircle className="h-5 w-5 text-[#5A6E5A]" />;
  }
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
  if (diffHr < 24) return `${diffHr} hour${diffHr !== 1 ? 's' : ''} ago`;
  if (diffDay < 30) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
  return new Date(dateStr).toLocaleDateString();
}

function SkeletonCard() {
  return (
    <div className="flex items-start gap-4 p-4 animate-pulse">
      <div className="h-10 w-10 rounded-full bg-gray-200 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-1/4" />
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await fetchApi('/notifications');
      setNotifications(data.notifications);
      setTotal(data.total);
    } catch (e: any) {
      toast.error(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    try {
      await fetchApi('/notifications/read-all', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e: any) {
      toast.error(e.message || 'Something went wrong');
    } finally {
      setMarkingAll(false);
    }
  };

  const handleClick = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await fetchApi(`/notifications/${notification.id}/read`, { method: 'POST' });
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
        );
      } catch (e: any) {
        toast.error(e.message || 'Something went wrong');
      }
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await fetchApi(`/notifications/${id}`, { method: 'DELETE' });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setTotal((prev) => prev - 1);
    } catch (e: any) {
      toast.error(e.message || 'Something went wrong');
    }
  };

  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1B2B1B]">Notifications</h1>
        {hasUnread && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={markingAll}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#2E7D32] hover:text-[#4CAF50] transition-colors disabled:opacity-50"
          >
            {markingAll ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCheck className="h-4 w-4" />
            )}
            Mark all as read
          </button>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
          {[...Array(5)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Bell className="h-8 w-8 text-[#5A6E5A]" />
          </div>
          <h2 className="text-lg font-semibold text-[#1B2B1B] mb-1">No notifications yet</h2>
          <p className="text-sm text-[#5A6E5A]">
            When you get notifications, they will show up here.
          </p>
        </div>
      )}

      {/* Notification list */}
      {!loading && notifications.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleClick(notification)}
              className={`group flex items-start gap-4 p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                !notification.isRead
                  ? 'border-l-4 border-[#2E7D32] bg-[#FAFAF5]'
                  : 'border-l-4 border-transparent'
              }`}
            >
              {/* Icon */}
              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                {getNotificationIcon(notification.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p
                    className={`text-sm ${
                      !notification.isRead
                        ? 'font-semibold text-[#1B2B1B]'
                        : 'font-medium text-[#1B2B1B]'
                    }`}
                  >
                    {notification.title}
                  </p>
                  <button
                    onClick={(e) => handleDelete(e, notification.id)}
                    className="sm:opacity-0 sm:group-hover:opacity-100 flex-shrink-0 p-1 rounded hover:bg-red-50 text-[#5A6E5A] hover:text-red-500 transition-all"
                    aria-label="Delete notification"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm text-[#5A6E5A] mt-0.5 line-clamp-2">{notification.body}</p>
                <p className="text-xs text-[#5A6E5A] mt-1">{relativeTime(notification.createdAt)}</p>
              </div>

              {/* Unread indicator */}
              {!notification.isRead && (
                <div className="h-2.5 w-2.5 rounded-full bg-[#2E7D32] flex-shrink-0 mt-1.5" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
