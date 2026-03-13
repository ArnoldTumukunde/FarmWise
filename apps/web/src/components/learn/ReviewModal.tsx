import { useState, useEffect } from 'react';
import { fetchApi } from '../../lib/api';
import { Star, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function ReviewModal({
  courseId,
  onClose,
  onReviewed,
}: {
  courseId: string;
  onClose: () => void;
  onReviewed?: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [content, setContent] = useState('');
  const [existingId, setExistingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchApi(`/reviews/courses/${courseId}/me`)
      .then(res => {
        if (res.review) {
          setRating(res.review.rating);
          setContent(res.review.content || '');
          setExistingId(res.review.id);
        }
      })
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, [courseId]);

  const handleSubmit = async () => {
    if (rating < 1 || rating > 5) {
      toast.error('Please select a rating from 1 to 5 stars.');
      return;
    }
    setSubmitting(true);
    try {
      if (existingId) {
        await fetchApi(`/reviews/${existingId}`, {
          method: 'PUT',
          body: JSON.stringify({ rating, content }),
        });
        toast.success('Review updated!');
      } else {
        await fetchApi(`/reviews/courses/${courseId}`, {
          method: 'POST',
          body: JSON.stringify({ rating, content }),
        });
        toast.success('Review submitted! Thank you for your feedback.');
      }
      if (onReviewed) onReviewed();
      onClose();
    } catch (e: any) {
      toast.error(e.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 id="review-modal-title" className="text-lg font-bold text-[#1B2B1B]">
            {existingId ? 'Edit Your Review' : 'Leave a Review'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-gray-100 transition-colors text-[#5A6E5A] focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-[#2E7D32]" />
            </div>
          ) : (
            <>
              {/* Star Rating */}
              <div className="text-center space-y-3">
                <p className="text-sm text-[#5A6E5A]">How would you rate this course?</p>
                <div className="flex gap-2 justify-center">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="transition-transform hover:scale-110 active:scale-95 p-1 focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2 rounded"
                      aria-label={`${star} star${star !== 1 ? 's' : ''}`}
                    >
                      <Star
                        size={36}
                        className={`transition-colors ${
                          (hoverRating || rating) >= star
                            ? 'fill-[#F57F17] text-[#F57F17]'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {(hoverRating || rating) > 0 && (
                  <p className="text-sm font-medium text-[#F57F17]">
                    {ratingLabels[hoverRating || rating]}
                  </p>
                )}
              </div>

              {/* Review Content */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#1B2B1B]">
                  Review (Optional)
                </label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Share your experience with other students..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-[#FAFAF5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2 min-h-[120px] resize-y placeholder:text-[#5A6E5A]/50"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!loading && (
          <div className="flex gap-3 p-5 pt-0">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 font-medium text-[#1B2B1B] hover:bg-gray-100 rounded-lg transition-colors text-sm focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={rating === 0 || submitting}
              className="flex-1 px-6 py-2.5 font-medium bg-[#2E7D32] text-white hover:bg-[#2E7D32]/90 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm text-sm flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {existingId ? 'Update Review' : 'Submit Review'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
