import { useState, useEffect } from 'react';
import { fetchApi } from '../../lib/api';
import { MessageCircle, ThumbsUp, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function QASection({ lectureId }: { lectureId: string }) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [upvotedAnswers, setUpvotedAnswers] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadQuestions();
  }, [lectureId]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const res = await fetchApi(`/community/lectures/${lectureId}/questions`);
      setQuestions(res.questions);
    } catch (e) {
      console.error('Failed to load QA', e);
    } finally {
      setLoading(false);
    }
  };

  const askQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;
    setSubmitting(true);
    try {
      await fetchApi(`/community/lectures/${lectureId}/questions`, {
        method: 'POST',
        body: JSON.stringify({ content: newQuestion }),
      });
      setNewQuestion('');
      toast.success('Question posted!');
      loadQuestions();
    } catch (e) {
      toast.error('Failed to post question. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async (answerId: string) => {
    try {
      const res = await fetchApi(`/community/answers/${answerId}/upvote`, {
        method: 'POST',
      });
      // Update local upvote state
      setUpvotedAnswers((prev) => {
        const next = new Set(prev);
        if (res.upvoted) {
          next.add(answerId);
        } else {
          next.delete(answerId);
        }
        return next;
      });
      // Update the answer's upvotes count in local state
      setQuestions((prev) =>
        prev.map((q) => ({
          ...q,
          answers: q.answers?.map((a: any) =>
            a.id === answerId
              ? { ...a, upvotes: a.upvotes + (res.upvoted ? 1 : -1) }
              : a
          ),
        }))
      );
    } catch (e) {
      toast.error('Failed to upvote. Please try again.');
    }
  };

  const getInitial = (name: string) => {
    return (name || 'S').charAt(0).toUpperCase();
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-2">
        <MessageCircle size={20} className="text-[#2E7D32]" />
        <h3 className="text-lg font-bold text-[#1B2B1B]">Questions & Answers</h3>
        {questions.length > 0 && (
          <span className="text-xs bg-gray-200 text-[#5A6E5A] px-2 py-0.5 rounded-full font-medium">
            {questions.length}
          </span>
        )}
      </div>

      {/* Ask Question Form */}
      <form onSubmit={askQuestion} className="flex gap-2">
        <input
          type="text"
          value={newQuestion}
          onChange={e => setNewQuestion(e.target.value)}
          placeholder="Ask a question about this lecture..."
          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2 placeholder:text-[#5A6E5A]/60"
        />
        <button
          type="submit"
          disabled={!newQuestion.trim() || submitting}
          className="px-5 py-2.5 bg-[#2E7D32] text-white font-medium rounded-lg hover:bg-[#2E7D32]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          Ask
        </button>
      </form>

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-4 bg-white border border-gray-200 rounded-xl animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-gray-200" />
                <div>
                  <div className="w-24 h-3 bg-gray-200 rounded" />
                  <div className="w-16 h-2 bg-gray-100 rounded mt-1.5" />
                </div>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded" />
              <div className="w-3/4 h-3 bg-gray-100 rounded mt-2" />
            </div>
          ))}
        </div>
      )}

      {/* Questions List */}
      {!loading && (
        <div className="space-y-4">
          {questions.map(q => {
            const displayName = q.user?.profile?.displayName || 'Student';
            return (
              <div
                key={q.id}
                className="p-4 bg-white border border-gray-200 rounded-xl hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-[#2E7D32]/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-semibold text-[#2E7D32]">
                      {getInitial(displayName)}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-[#1B2B1B]">{displayName}</span>
                      {q.createdAt && (
                        <span className="text-xs text-[#5A6E5A]">{formatDate(q.createdAt)}</span>
                      )}
                    </div>
                    <p className="mt-1.5 text-sm text-[#1B2B1B] leading-relaxed">{q.content}</p>

                    {/* Answers */}
                    {q.answers && q.answers.length > 0 && (
                      <div className="mt-3 pl-4 border-l-2 border-[#2E7D32]/20 space-y-3">
                        {q.answers.map((a: any) => (
                          <div key={a.id} className="text-sm">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-[#1B2B1B]">
                                {a.user?.profile?.displayName || 'Instructor'}
                              </span>
                              {a.createdAt && (
                                <span className="text-xs text-[#5A6E5A]">
                                  {formatDate(a.createdAt)}
                                </span>
                              )}
                            </div>
                            <p className="text-[#1B2B1B]/80 mt-1">{a.content}</p>
                            <button
                              onClick={() => handleUpvote(a.id)}
                              className={`flex items-center gap-1 text-xs mt-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2 rounded px-1.5 py-0.5 ${
                                upvotedAnswers.has(a.id)
                                  ? 'text-[#2E7D32] bg-[#2E7D32]/10 font-medium'
                                  : 'text-[#5A6E5A] hover:text-[#2E7D32]'
                              }`}
                            >
                              <ThumbsUp size={12} className={upvotedAnswers.has(a.id) ? 'fill-[#2E7D32]' : ''} />
                              {a.upvotes > 0 && <span>{a.upvotes}</span>}
                              <span>Helpful</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Empty State */}
          {questions.length === 0 && (
            <div className="py-12 text-center">
              <div className="w-14 h-14 mx-auto bg-[#2E7D32]/10 rounded-full flex items-center justify-center mb-4">
                <MessageCircle size={24} className="text-[#2E7D32]" />
              </div>
              <p className="text-[#5A6E5A] text-sm font-medium">No questions yet.</p>
              <p className="text-[#5A6E5A] text-xs mt-1">Be the first to ask!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
