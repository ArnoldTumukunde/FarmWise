import { useState, useEffect } from 'react';
import { fetchApi } from '../../lib/api';
import { toast } from 'sonner';
import { ShieldCheck, Eye, EyeOff, Star, Loader2, Trash2 } from 'lucide-react';

function SkeletonReviewCard() {
  return (
    <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-6 animate-pulse">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex gap-2">
            <div className="h-4 w-32 bg-[#2E7D32]/10 rounded" />
            <div className="h-4 w-40 bg-[#2E7D32]/10 rounded" />
          </div>
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-4 h-4 bg-[#2E7D32]/10 rounded" />
            ))}
          </div>
          <div className="h-16 w-full bg-[#2E7D32]/10 rounded" />
          <div className="h-3 w-28 bg-[#2E7D32]/10 rounded" />
        </div>
        <div className="flex gap-2 sm:flex-col sm:w-32">
          <div className="h-10 flex-1 sm:flex-initial bg-[#2E7D32]/10 rounded-lg" />
          <div className="h-10 flex-1 sm:flex-initial bg-[#2E7D32]/10 rounded-lg" />
          <div className="h-10 flex-1 sm:flex-initial bg-[#2E7D32]/10 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function ReviewsLayout() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = () => {
    fetchApi('/admin/reviews/flagged')
      .then(res => setReviews(res.reviews))
      .finally(() => setLoading(false));
  };

  const moderateReview = async (id: string, isHidden: boolean) => {
    setActionLoading(id + String(isHidden));
    try {
      await fetchApi(`/admin/reviews/${id}/moderate`, {
        method: 'POST',
        body: JSON.stringify({ isHidden })
      });
      toast.success(isHidden ? 'Review hidden successfully' : 'Review marked as safe');
      loadReviews();
    } catch (e: any) {
      toast.error(e.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const deleteReview = async (id: string) => {
    if (!window.confirm('Permanently delete this review? This cannot be undone.')) return;
    setActionLoading(id + 'delete');
    try {
      await fetchApi(`/admin/reviews/${id}`, { method: 'DELETE' });
      toast.success('Review permanently deleted');
      setReviews(prev => prev.filter(r => r.id !== id));
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete review');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1B2B1B]">Flagged Reviews</h1>
        <p className="text-sm text-[#5A6E5A] mt-1">Low-rated reviews requiring moderation</p>
      </div>

      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonReviewCard key={i} />)
        ) : reviews.length > 0 ? (
          reviews.map(review => (
            <div key={review.id} className="bg-white rounded-xl border border-[#2E7D32]/10 p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="font-semibold text-[#1B2B1B]">{review.user?.profile?.displayName || 'Unknown'}</span>
                    <span className="text-xs text-[#5A6E5A]">on</span>
                    <span className="text-sm font-medium text-[#2E7D32]">{review.course?.title || 'Unknown Course'}</span>
                  </div>

                  {/* Star Rating */}
                  <div className="flex items-center gap-0.5 mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}
                      />
                    ))}
                    <span className="ml-2 text-xs text-[#5A6E5A]">{review.rating}/5</span>
                  </div>

                  {/* Content */}
                  <div className="bg-[#FAFAF5] border border-[#2E7D32]/10 rounded-lg p-3 mb-3">
                    <p className="text-sm text-[#1B2B1B] leading-relaxed">
                      {review.content || 'No text content provided.'}
                    </p>
                  </div>

                  <p className="text-xs text-[#5A6E5A]">
                    Posted {new Date(review.createdAt).toLocaleDateString('en-UG', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 sm:flex-col sm:min-w-[140px]">
                  <button
                    onClick={() => moderateReview(review.id, true)}
                    disabled={!!actionLoading}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                  >
                    {actionLoading === review.id + 'true' ? <Loader2 size={16} className="animate-spin" /> : <EyeOff size={16} />}
                    Hide Review
                  </button>
                  <button
                    onClick={() => moderateReview(review.id, false)}
                    disabled={!!actionLoading}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border border-[#2E7D32] text-[#2E7D32] hover:bg-[#2E7D32]/5 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                  >
                    {actionLoading === review.id + 'false' ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />}
                    Mark Safe
                  </button>
                  <button
                    onClick={() => deleteReview(review.id)}
                    disabled={!!actionLoading}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-red-800 text-white hover:bg-red-900 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 focus-visible:ring-offset-2"
                  >
                    {actionLoading === review.id + 'delete' ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    Delete Permanently
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl border border-[#2E7D32]/10 py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-[#2E7D32]/5 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck size={28} className="text-[#2E7D32]" />
            </div>
            <p className="text-[#1B2B1B] font-semibold mb-1">All clear!</p>
            <p className="text-sm text-[#5A6E5A]">No flagged reviews currently.</p>
          </div>
        )}
      </div>
    </div>
  );
}
