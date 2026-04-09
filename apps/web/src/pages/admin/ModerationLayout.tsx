import { useState, useEffect } from 'react';
import { fetchApi } from '../../lib/api';
import { toast } from 'sonner';
import {
  Shield,
  Star,
  CheckCircle,
  Trash2,
  Flag,
  Loader2,
  MessageCircleQuestion,
  AlertTriangle,
} from 'lucide-react';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' });

type ReviewFilter = 'all' | 'reported' | 'low_rated' | 'recent';

const reviewTabs: { label: string; value: ReviewFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Reported', value: 'reported' },
  { label: 'Low-rated (1-2)', value: 'low_rated' },
  { label: 'Recent', value: 'recent' },
];

/* ── Skeleton ─────────────────────────────────────────── */

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-5 animate-pulse space-y-3">
      <div className="flex gap-2">
        <div className="h-4 w-32 bg-[#2E7D32]/10 rounded" />
        <div className="h-4 w-20 bg-[#2E7D32]/10 rounded" />
      </div>
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="w-4 h-4 bg-[#2E7D32]/10 rounded" />
        ))}
      </div>
      <div className="h-12 w-full bg-[#2E7D32]/10 rounded" />
      <div className="h-3 w-24 bg-[#2E7D32]/10 rounded" />
    </div>
  );
}

/* ── Main component ───────────────────────────────────── */

export function ModerationLayout() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'reviews' | 'qa'>('reviews');

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetchApi('/admin/reviews/moderation').catch(() => ({ reviews: [] })),
      fetchApi('/admin/questions/moderation').catch(() => ({ questions: [] })),
    ])
      .then(([reviewsData, questionsData]) => {
        setReviews(reviewsData.reviews || reviewsData || []);
        setQuestions(questionsData.questions || questionsData || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  /* ── Filter reviews ─────────────────────────────────── */

  const filteredReviews = reviews.filter((r) => {
    switch (reviewFilter) {
      case 'reported':
        return r.isReported || r.isFlagged;
      case 'low_rated':
        return r.rating <= 2;
      case 'recent':
        return new Date(r.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      default:
        return true;
    }
  });

  /* ── Review actions ─────────────────────────────────── */

  const approveReview = async (id: string) => {
    setActionLoading(`approve-${id}`);
    try {
      await fetchApi(`/admin/reviews/${id}/approve`, { method: 'POST' });
      toast.success('Review approved');
      loadData();
    } catch (e: any) {
      toast.error(e.message || 'Failed to approve review');
    } finally {
      setActionLoading(null);
    }
  };

  const removeReview = async (id: string) => {
    setActionLoading(`remove-${id}`);
    try {
      await fetchApi(`/admin/reviews/${id}/remove`, { method: 'POST' });
      toast.success('Review removed');
      loadData();
    } catch (e: any) {
      toast.error(e.message || 'Failed to remove review');
    } finally {
      setActionLoading(null);
    }
  };

  const flagInstructor = async (id: string) => {
    setActionLoading(`flag-${id}`);
    try {
      await fetchApi(`/admin/reviews/${id}/flag-instructor`, { method: 'POST' });
      toast.success('Instructor flagged for review');
      loadData();
    } catch (e: any) {
      toast.error(e.message || 'Failed to flag instructor');
    } finally {
      setActionLoading(null);
    }
  };

  /* ── Q&A actions ────────────────────────────────────── */

  const removeQuestion = async (id: string) => {
    setActionLoading(`qremove-${id}`);
    try {
      await fetchApi(`/admin/questions/${id}/remove`, { method: 'POST' });
      toast.success('Question removed');
      loadData();
    } catch (e: any) {
      toast.error(e.message || 'Failed to remove question');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1B2B1B]">Content Moderation</h1>
        <p className="text-sm text-[#5A6E5A] mt-1">Review and moderate user-generated content</p>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 bg-[#FAFAF5] p-1 rounded-lg border border-[#2E7D32]/10 w-fit">
        <button
          onClick={() => setActiveSection('reviews')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
            activeSection === 'reviews'
              ? 'bg-white text-[#1B2B1B] shadow-sm'
              : 'text-[#5A6E5A] hover:text-[#1B2B1B]'
          }`}
        >
          <Star size={15} />
          Reviews Queue
          {reviews.length > 0 && (
            <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700">{reviews.length}</span>
          )}
        </button>
        <button
          onClick={() => setActiveSection('qa')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
            activeSection === 'qa'
              ? 'bg-white text-[#1B2B1B] shadow-sm'
              : 'text-[#5A6E5A] hover:text-[#1B2B1B]'
          }`}
        >
          <MessageCircleQuestion size={15} />
          Q&A Queue
          {questions.length > 0 && (
            <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700">{questions.length}</span>
          )}
        </button>
      </div>

      {/* Reviews Section */}
      {activeSection === 'reviews' && (
        <div className="space-y-6">
          {/* Review filter tabs */}
          <div className="flex gap-1 bg-[#FAFAF5] p-1 rounded-lg border border-[#2E7D32]/10 w-fit">
            {reviewTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setReviewFilter(tab.value)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  reviewFilter === tab.value
                    ? 'bg-white text-[#1B2B1B] shadow-sm'
                    : 'text-[#5A6E5A] hover:text-[#1B2B1B]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Review cards */}
          <div className="space-y-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
            ) : filteredReviews.length > 0 ? (
              filteredReviews.map((review) => (
                <div key={review.id} className="bg-white rounded-xl border border-[#2E7D32]/10 p-5">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap mb-2">
                        <p className="font-semibold text-[#1B2B1B] text-sm">
                          {review.course?.title || 'Unknown Course'}
                        </p>
                        {(review.isReported || review.isFlagged) && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20">
                            <AlertTriangle size={12} />
                            Reported
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[#5A6E5A] mb-2">
                        by {review.user?.profile?.displayName || review.user?.email || 'Unknown Farmer'}
                      </p>
                      <div className="flex items-center gap-0.5 mb-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            className={i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}
                          />
                        ))}
                        <span className="text-xs text-[#5A6E5A] ml-2">{review.rating}/5</span>
                      </div>
                      <p className="text-sm text-[#1B2B1B] leading-relaxed">{review.body || review.content}</p>
                      <p className="text-xs text-[#5A6E5A] mt-3">{formatDate(review.createdAt)}</p>
                    </div>

                    <div className="flex sm:flex-col gap-2 sm:min-w-[120px]">
                      <button
                        onClick={() => approveReview(review.id)}
                        disabled={!!actionLoading}
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-[#2E7D32] text-white hover:bg-[#2E7D32]/90 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-1"
                      >
                        {actionLoading === `approve-${review.id}` ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <CheckCircle size={14} />
                        )}
                        Approve
                      </button>
                      <button
                        onClick={() => removeReview(review.id)}
                        disabled={!!actionLoading}
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1"
                      >
                        {actionLoading === `remove-${review.id}` ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                        Remove
                      </button>
                      <button
                        onClick={() => flagInstructor(review.id)}
                        disabled={!!actionLoading}
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-50 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1"
                      >
                        {actionLoading === `flag-${review.id}` ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Flag size={14} />
                        )}
                        Flag Instructor
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-xl border border-[#2E7D32]/10 py-16 text-center">
                <div className="w-12 h-12 rounded-full bg-[#2E7D32]/5 flex items-center justify-center mx-auto mb-3">
                  <Shield size={20} className="text-[#5A6E5A]" />
                </div>
                <p className="text-[#1B2B1B] font-semibold mb-1">No reviews to moderate</p>
                <p className="text-sm text-[#5A6E5A]">
                  {reviewFilter !== 'all' ? 'No reviews match this filter.' : 'All reviews are clean.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Q&A Section */}
      {activeSection === 'qa' && (
        <div className="space-y-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
          ) : questions.length > 0 ? (
            questions.map((q) => (
              <div key={q.id} className="bg-white rounded-xl border border-[#2E7D32]/10 p-5">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <p className="font-semibold text-[#1B2B1B] text-sm">
                        {q.lecture?.title || q.course?.title || 'Unknown Context'}
                      </p>
                      {(q.isReported || q.isFlagged) && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20">
                          <AlertTriangle size={12} />
                          Reported
                        </span>
                      )}
                      {!q.answers?.length && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20">
                          Unanswered
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#5A6E5A] mb-2">
                      by {q.user?.profile?.displayName || q.user?.email || 'Unknown'}
                    </p>
                    <p className="text-sm text-[#1B2B1B] leading-relaxed">{q.body || q.content}</p>
                    <p className="text-xs text-[#5A6E5A] mt-3">{formatDate(q.createdAt)}</p>
                  </div>
                  <div className="flex sm:flex-col gap-2 sm:min-w-[100px]">
                    <button
                      onClick={() => removeQuestion(q.id)}
                      disabled={!!actionLoading}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1"
                    >
                      {actionLoading === `qremove-${q.id}` ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl border border-[#2E7D32]/10 py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-[#2E7D32]/5 flex items-center justify-center mx-auto mb-3">
                <MessageCircleQuestion size={20} className="text-[#5A6E5A]" />
              </div>
              <p className="text-[#1B2B1B] font-semibold mb-1">No questions to moderate</p>
              <p className="text-sm text-[#5A6E5A]">All Q&A content is clean.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
