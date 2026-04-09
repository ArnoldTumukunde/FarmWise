import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Star,
  MessageSquare,
  Send,
  Loader2,
  Pencil,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: { id: string; name: string };
  instructorResponse?: string;
}

type StarFilter = 'ALL' | 1 | 2 | 3 | 4 | 5;

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-UG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-4 h-4 ${
            s <= rating ? 'fill-[#F57F17] text-[#F57F17]' : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );
}

function SkeletonReviews() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-xl border border-[#2E7D32]/10 p-6 animate-pulse">
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-3 w-20 bg-gray-100 rounded" />
              <div className="h-4 w-full bg-gray-100 rounded mt-2" />
              <div className="h-4 w-3/4 bg-gray-100 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ReviewManagement() {
  const { courseId } = useParams<{ courseId: string }>();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [starFilter, setStarFilter] = useState<StarFilter>('ALL');
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [editingResponse, setEditingResponse] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!courseId) return;
    fetchApi(`/reviews/course/${courseId}`)
      .then((res) => setReviews(res.reviews || res.data || res || []))
      .catch(() => toast.error('Failed to load reviews'))
      .finally(() => setLoading(false));
  }, [courseId]);

  const filteredReviews = reviews
    .filter((r) => starFilter === 'ALL' || r.rating === starFilter)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '0.0';

  const handleRespond = async (reviewId: string) => {
    if (!responseText.trim()) return;
    setSubmitting(true);
    try {
      await fetchApi(`/reviews/${reviewId}/respond`, {
        method: 'POST',
        body: JSON.stringify({ response: responseText.trim() }),
      });
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId ? { ...r, instructorResponse: responseText.trim() } : r
        )
      );
      setRespondingTo(null);
      setEditingResponse(null);
      setResponseText('');
      toast.success('Response posted');
    } catch {
      toast.error('Failed to post response');
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (review: Review) => {
    setEditingResponse(review.id);
    setRespondingTo(null);
    setResponseText(review.instructorResponse || '');
  };

  return (
    <div className="bg-[#FAFAF5] min-h-screen p-4 md:p-8 font-[Inter]">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[#1B2B1B]">Reviews</h1>
          <p className="text-[#5A6E5A] text-sm mt-1">
            {reviews.length} review{reviews.length !== 1 ? 's' : ''} — Average: {avgRating}{' '}
            <Star className="w-3.5 h-3.5 inline fill-[#F57F17] text-[#F57F17]" />
          </p>
        </div>

        {/* Star Filter */}
        <div className="flex gap-1 flex-wrap bg-white rounded-lg border border-[#2E7D32]/10 p-1 w-fit">
          <button
            onClick={() => setStarFilter('ALL')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              starFilter === 'ALL'
                ? 'bg-[#2E7D32] text-white'
                : 'text-[#5A6E5A] hover:bg-gray-100'
            }`}
          >
            All
          </button>
          {[5, 4, 3, 2, 1].map((s) => (
            <button
              key={s}
              onClick={() => setStarFilter(s as StarFilter)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1 ${
                starFilter === s
                  ? 'bg-[#2E7D32] text-white'
                  : 'text-[#5A6E5A] hover:bg-gray-100'
              }`}
            >
              {s} <Star className={`w-3 h-3 ${starFilter === s ? 'fill-white' : 'fill-[#F57F17] text-[#F57F17]'}`} />
            </button>
          ))}
        </div>

        {/* Reviews */}
        {loading ? (
          <SkeletonReviews />
        ) : filteredReviews.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-12 text-center">
            <Star className="w-12 h-12 text-[#5A6E5A] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#1B2B1B] mb-2">No reviews found</h3>
            <p className="text-[#5A6E5A]">
              {starFilter !== 'ALL'
                ? 'No reviews match this filter.'
                : 'Reviews from students will appear here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <div
                key={review.id}
                className="bg-white rounded-xl border border-[#2E7D32]/10 p-6"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#2E7D32]/10 flex items-center justify-center text-[#2E7D32] font-semibold text-sm flex-shrink-0">
                    {review.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-[#1B2B1B]">{review.user.name}</span>
                      <span className="text-xs text-[#5A6E5A]">{formatDate(review.createdAt)}</span>
                    </div>
                    <div className="mt-1">
                      <StarDisplay rating={review.rating} />
                    </div>
                    <p className="mt-3 text-[#1B2B1B] text-sm whitespace-pre-wrap">
                      {review.comment}
                    </p>

                    {/* Instructor Response */}
                    {review.instructorResponse && editingResponse !== review.id && (
                      <div className="mt-4 bg-[#FAFAF5] rounded-lg p-4 border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-[#2E7D32]">
                            Your Response
                          </span>
                          <button
                            onClick={() => startEdit(review)}
                            className="p-1 text-[#5A6E5A] hover:text-[#1B2B1B] rounded"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-sm text-[#1B2B1B] whitespace-pre-wrap">
                          {review.instructorResponse}
                        </p>
                      </div>
                    )}

                    {/* Respond / Edit Form */}
                    {(respondingTo === review.id || editingResponse === review.id) && (
                      <div className="mt-4 space-y-2">
                        <textarea
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          placeholder="Write your response..."
                          rows={3}
                          className="w-full rounded-lg border border-[#2E7D32]/10 px-3 py-2 text-sm text-[#1B2B1B] placeholder-[#5A6E5A] focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/20 resize-none"
                        />
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setRespondingTo(null);
                              setEditingResponse(null);
                              setResponseText('');
                            }}
                            className="border-gray-200"
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleRespond(review.id)}
                            disabled={!responseText.trim() || submitting}
                            className="bg-[#2E7D32] hover:bg-[#256329] text-white"
                          >
                            {submitting ? (
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4 mr-1" />
                            )}
                            {editingResponse ? 'Update' : 'Post'}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Respond Button */}
                    {!review.instructorResponse &&
                      respondingTo !== review.id &&
                      editingResponse !== review.id && (
                        <button
                          onClick={() => {
                            setRespondingTo(review.id);
                            setEditingResponse(null);
                            setResponseText('');
                          }}
                          className="mt-3 flex items-center gap-1.5 text-sm text-[#2E7D32] hover:text-[#256329] font-medium"
                        >
                          <MessageSquare className="w-4 h-4" />
                          Respond to this review
                        </button>
                      )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
