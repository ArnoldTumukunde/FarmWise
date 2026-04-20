import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  MessageSquare,
  ThumbsUp,
  Send,
  Loader2,
  ChevronRight,
  Filter,
  ArrowUpDown,
} from 'lucide-react';
import { toast } from 'sonner';

interface Answer {
  id: string;
  body: string;
  createdAt: string;
  user: { id: string; name: string; role?: string };
}

interface Question {
  id: string;
  title?: string;
  body: string;
  createdAt: string;
  upvotes: number;
  lectureId: string;
  lectureTitle?: string;
  user: { id: string; name: string };
  answers: Answer[];
  isAnswered: boolean;
}

type FilterType = 'ALL' | 'UNANSWERED' | 'ANSWERED';
type SortType = 'NEWEST' | 'OLDEST' | 'MOST_UPVOTED';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-UG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function SkeletonPanel() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="p-4 rounded-lg border border-gray-100">
          <div className="h-4 w-32 bg-gray-200 rounded" />
          <div className="h-3 w-full bg-gray-100 rounded mt-2" />
          <div className="h-3 w-20 bg-gray-100 rounded mt-2" />
        </div>
      ))}
    </div>
  );
}

export default function QAManagement() {
  const { courseId } = useParams<{ courseId: string }>();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [sort, setSort] = useState<SortType>('NEWEST');
  const [showMobileList, setShowMobileList] = useState(true);

  useEffect(() => {
    if (!courseId) return;
    fetchApi(`/instructor/courses/${courseId}/questions`)
      .then((res) => {
        const qs = res.questions || res.data || res || [];
        setQuestions(
          qs.map((q: any) => ({
            ...q,
            isAnswered: (q.answers?.length || 0) > 0,
          }))
        );
      })
      .catch(() => toast.error('Failed to load questions'))
      .finally(() => setLoading(false));
  }, [courseId]);

  const filteredQuestions = questions
    .filter((q) => {
      if (filter === 'UNANSWERED') return !q.isAnswered;
      if (filter === 'ANSWERED') return q.isAnswered;
      return true;
    })
    .sort((a, b) => {
      if (sort === 'OLDEST') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sort === 'MOST_UPVOTED') return b.upvotes - a.upvotes;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const selectedQuestion = questions.find((q) => q.id === selectedId);

  const handleReply = async () => {
    if (!replyText.trim() || !selectedQuestion) return;
    setReplying(true);
    try {
      const res = await fetchApi(`/community/questions/${selectedQuestion.id}/answers`, {
        method: 'POST',
        body: JSON.stringify({ content: replyText.trim() }),
      });
      const newAnswer = res.answer || res;
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === selectedQuestion.id
            ? { ...q, answers: [...q.answers, newAnswer], isAnswered: true }
            : q
        )
      );
      setReplyText('');
      toast.success('Answer posted');
    } catch {
      toast.error('Failed to post answer');
    } finally {
      setReplying(false);
    }
  };

  const selectQuestion = (id: string) => {
    setSelectedId(id);
    setShowMobileList(false);
  };

  return (
    <div className="bg-[#FAFAF5] min-h-screen p-4 md:p-8 font-[Inter]">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1B2B1B]">Q&A Management</h1>
          <p className="text-[#5A6E5A] text-sm mt-1">
            Answer student questions and manage discussions
          </p>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-6">
            <SkeletonPanel />
          </div>
        ) : questions.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-12 text-center">
            <MessageSquare className="w-12 h-12 text-[#5A6E5A] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#1B2B1B] mb-2">No questions yet</h3>
            <p className="text-[#5A6E5A]">
              Questions from students will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 min-h-[600px]">
            {/* Left Panel - Question List */}
            <div
              className={`md:col-span-2 bg-white rounded-xl border border-[#2E7D32]/10 overflow-hidden flex flex-col ${
                !showMobileList ? 'hidden md:flex' : 'flex'
              }`}
            >
              {/* Filters */}
              <div className="p-3 border-b border-gray-100 space-y-2">
                <div className="flex gap-1">
                  {(['ALL', 'UNANSWERED', 'ANSWERED'] as FilterType[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                        filter === f
                          ? 'bg-[#2E7D32] text-white'
                          : 'text-[#5A6E5A] hover:bg-gray-100'
                      }`}
                    >
                      {f === 'ALL' ? 'All' : f === 'UNANSWERED' ? 'Unanswered' : 'Answered'}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1">
                  {(['NEWEST', 'OLDEST', 'MOST_UPVOTED'] as SortType[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSort(s)}
                      className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                        sort === s
                          ? 'bg-gray-200 text-[#1B2B1B]'
                          : 'text-[#5A6E5A] hover:bg-gray-100'
                      }`}
                    >
                      {s === 'MOST_UPVOTED' ? 'Most Upvoted' : s.charAt(0) + s.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Questions */}
              <div className="flex-1 overflow-y-auto">
                {filteredQuestions.length === 0 ? (
                  <p className="text-center text-[#5A6E5A] text-sm p-6">No questions match this filter.</p>
                ) : (
                  filteredQuestions.map((q) => (
                    <button
                      key={q.id}
                      onClick={() => selectQuestion(q.id)}
                      className={`w-full text-left p-4 border-b border-gray-50 hover:bg-[#FAFAF5] transition-colors ${
                        selectedId === q.id ? 'bg-[#2E7D32]/5 border-l-2 border-l-[#2E7D32]' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-[#5A6E5A]">{q.user.name}</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                                q.isAnswered
                                  ? 'bg-[#2E7D32]/10 text-[#2E7D32]'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {q.isAnswered ? 'ANSWERED' : 'UNANSWERED'}
                            </span>
                          </div>
                          <p className="text-sm text-[#1B2B1B] line-clamp-2">{q.body}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-[#5A6E5A]">
                            <span>{formatDate(q.createdAt)}</span>
                            <span className="flex items-center gap-1">
                              <ThumbsUp className="w-3 h-3" /> {q.upvotes}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#5A6E5A] flex-shrink-0 mt-1 md:hidden" />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Right Panel - Answer Editor */}
            <div
              className={`md:col-span-3 bg-white rounded-xl border border-[#2E7D32]/10 flex flex-col ${
                showMobileList ? 'hidden md:flex' : 'flex'
              }`}
            >
              {selectedQuestion ? (
                <>
                  {/* Back button on mobile */}
                  <button
                    onClick={() => setShowMobileList(true)}
                    className="md:hidden p-3 border-b border-gray-100 text-sm text-[#2E7D32] font-medium text-left"
                  >
                    Back to questions
                  </button>

                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Original question */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-[#2E7D32]/10 flex items-center justify-center text-[#2E7D32] font-semibold text-sm">
                          {selectedQuestion.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#1B2B1B]">
                            {selectedQuestion.user.name}
                          </p>
                          <p className="text-xs text-[#5A6E5A]">
                            {formatDate(selectedQuestion.createdAt)}
                          </p>
                        </div>
                      </div>
                      <p className="text-[#1B2B1B] whitespace-pre-wrap">{selectedQuestion.body}</p>
                      {selectedQuestion.lectureTitle && (
                        <p className="text-xs text-[#5A6E5A] mt-2">
                          Lecture: {selectedQuestion.lectureTitle}
                        </p>
                      )}
                    </div>

                    {/* Answers */}
                    {selectedQuestion.answers.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-[#5A6E5A] uppercase tracking-wide">
                          Answers ({selectedQuestion.answers.length})
                        </h3>
                        {selectedQuestion.answers.map((a) => (
                          <div
                            key={a.id}
                            className="bg-[#FAFAF5] rounded-lg p-4 border border-gray-100"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-medium text-[#1B2B1B]">
                                {a.user.name}
                              </span>
                              {(a.user.role === 'INSTRUCTOR' || a.user.role === 'instructor') && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#2E7D32]/10 text-[#2E7D32] font-semibold">
                                  INSTRUCTOR
                                </span>
                              )}
                              <span className="text-xs text-[#5A6E5A]">
                                {formatDate(a.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-[#1B2B1B] whitespace-pre-wrap">{a.body}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Reply */}
                  <div className="p-4 border-t border-gray-100">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write your answer..."
                      rows={3}
                      className="w-full rounded-lg border border-[#2E7D32]/10 px-3 py-2 text-sm text-[#1B2B1B] placeholder-[#5A6E5A] focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/20 resize-none"
                    />
                    <div className="flex justify-end mt-2">
                      <Button
                        onClick={handleReply}
                        disabled={!replyText.trim() || replying}
                        className="bg-[#2E7D32] hover:bg-[#256329] text-white"
                      >
                        {replying ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4 mr-2" />
                        )}
                        Post Answer
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-center p-6">
                  <div>
                    <MessageSquare className="w-10 h-10 text-[#5A6E5A] mx-auto mb-3" />
                    <p className="text-[#5A6E5A] text-sm">
                      Select a question from the list to view and respond.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
