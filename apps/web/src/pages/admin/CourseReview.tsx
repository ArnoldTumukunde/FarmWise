import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchApi } from '../../lib/api';
import { toast } from 'sonner';
import {
  ArrowLeft,
  BookOpen,
  CheckSquare,
  Square,
  User,
  Layers,
  PlayCircle,
  Loader2,
  FileText,
} from 'lucide-react';

const formatUGX = (amount: number) =>
  new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(amount);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' });

const levelBadge: Record<string, string> = {
  BEGINNER: 'bg-green-50 text-green-700 ring-green-600/20',
  INTERMEDIATE: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  ADVANCED: 'bg-purple-50 text-purple-700 ring-purple-600/20',
};

/* ── Skeleton ─────────────────────────────────────────── */

function SkeletonPreview() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-72 bg-[#2E7D32]/10 rounded" />
      <div className="h-5 w-96 bg-[#2E7D32]/10 rounded" />
      <div className="h-48 w-full bg-[#2E7D32]/10 rounded-xl" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-4 w-full bg-[#2E7D32]/10 rounded" />
        ))}
      </div>
    </div>
  );
}

function SkeletonPanel() {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-5 w-full bg-[#2E7D32]/10 rounded" />
      ))}
      <div className="h-32 w-full bg-[#2E7D32]/10 rounded" />
      <div className="h-12 w-full bg-[#2E7D32]/10 rounded-lg" />
      <div className="h-12 w-full bg-[#2E7D32]/10 rounded-lg" />
    </div>
  );
}

/* ── Checklist items ──────────────────────────────────── */

const checklistItems = [
  { id: 'title', label: 'Title is clear and descriptive' },
  { id: 'thumbnail', label: 'Thumbnail meets quality standards' },
  { id: 'structure', label: 'At least 2 sections and 5 lectures' },
  { id: 'video', label: 'Video quality is acceptable' },
  { id: 'plagiarism', label: 'No plagiarism detected' },
  { id: 'appropriate', label: 'Content is appropriate for FarmWise' },
];

/* ── Main component ───────────────────────────────────── */

export function CourseReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchApi(`/admin/courses/review?courseId=${id}`)
      .then((data) => setCourse(data.course || data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const toggleCheck = (key: string) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const allChecked = checklistItems.every((item) => checklist[item.id]);

  const handleAction = async (action: 'approve' | 'reject') => {
    if (action === 'reject' && !feedback.trim()) {
      toast.error('Please provide feedback before requesting changes');
      return;
    }
    setActionLoading(action);
    try {
      await fetchApi(`/admin/courses/${id}/moderate`, {
        method: 'POST',
        body: JSON.stringify({
          action,
          ...(action === 'reject' ? { feedback: feedback.trim() } : {}),
        }),
      });
      toast.success(
        action === 'approve' ? 'Course approved and published' : 'Changes requested — instructor notified'
      );
      navigate('/admin/courses');
    } catch (e: any) {
      toast.error(e.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  /* ── Error state ──────────────────────────────────────── */

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <span className="text-red-500 text-2xl">!</span>
        </div>
        <p className="text-[#1B2B1B] font-semibold mb-1">Failed to load course</p>
        <p className="text-sm text-[#5A6E5A]">{error}</p>
        <button
          onClick={() => navigate('/admin/courses')}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-[#2E7D32]/20 text-[#1B2B1B] hover:bg-[#FAFAF5] transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Courses
        </button>
      </div>
    );
  }

  /* ── Render ───────────────────────────────────────────── */

  const totalSections = course?.sections?.length || 0;
  const totalLectures = course?.sections?.reduce((acc: number, s: any) => acc + (s.lectures?.length || 0), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Back button + header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/courses')}
          className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-[#2E7D32]/20 text-[#1B2B1B] hover:bg-[#FAFAF5] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#1B2B1B]">Course Review</h1>
          <p className="text-sm text-[#5A6E5A] mt-0.5">Review submitted course before publishing</p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Course Preview (70%) */}
        <div className="lg:w-[70%] space-y-6">
          {loading ? (
            <SkeletonPreview />
          ) : (
            <>
              {/* Thumbnail */}
              {course.thumbnailUrl && (
                <div className="rounded-xl overflow-hidden border border-[#2E7D32]/10">
                  <img
                    src={course.thumbnailUrl}
                    alt={course.title}
                    className="w-full h-64 object-cover"
                  />
                </div>
              )}

              {/* Title + meta */}
              <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-6">
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <h2 className="text-xl font-bold text-[#1B2B1B]">{course.title}</h2>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ring-1 ring-inset ${
                      levelBadge[course.level] || 'bg-gray-50 text-gray-700'
                    }`}
                  >
                    {course.level}
                  </span>
                </div>
                {course.subtitle && (
                  <p className="text-[#5A6E5A] mb-4">{course.subtitle}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-[#5A6E5A] flex-wrap">
                  <span className="font-semibold text-[#1B2B1B]">
                    {Number(course.price) === 0 ? 'Free' : formatUGX(Number(course.price))}
                  </span>
                  <span>{totalSections} section{totalSections !== 1 ? 's' : ''}</span>
                  <span>{totalLectures} lecture{totalLectures !== 1 ? 's' : ''}</span>
                  <span>Created {formatDate(course.createdAt)}</span>
                </div>
              </div>

              {/* Description */}
              <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-6">
                <h3 className="text-lg font-semibold text-[#1B2B1B] mb-3 flex items-center gap-2">
                  <FileText size={18} className="text-[#2E7D32]" />
                  Description
                </h3>
                <div
                  className="prose prose-sm max-w-none text-[#1B2B1B]"
                  dangerouslySetInnerHTML={{ __html: course.description || '<p class="text-[#5A6E5A]">No description provided.</p>' }}
                />
              </div>

              {/* Sections & Lectures */}
              <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-6">
                <h3 className="text-lg font-semibold text-[#1B2B1B] mb-4 flex items-center gap-2">
                  <Layers size={18} className="text-[#2E7D32]" />
                  Course Content
                </h3>
                {course.sections?.length > 0 ? (
                  <div className="space-y-4">
                    {course.sections.map((section: any, sIdx: number) => (
                      <div key={section.id} className="border border-[#2E7D32]/10 rounded-lg">
                        <div className="bg-[#FAFAF5] px-4 py-3 rounded-t-lg">
                          <p className="font-medium text-[#1B2B1B]">
                            Section {sIdx + 1}: {section.title}
                          </p>
                          <p className="text-xs text-[#5A6E5A]">
                            {section.lectures?.length || 0} lecture{(section.lectures?.length || 0) !== 1 ? 's' : ''}
                          </p>
                        </div>
                        {section.lectures?.length > 0 && (
                          <ul className="divide-y divide-[#2E7D32]/5">
                            {section.lectures.map((lecture: any, lIdx: number) => (
                              <li key={lecture.id} className="px-4 py-2.5 flex items-center gap-3 text-sm">
                                <PlayCircle size={16} className="text-[#5A6E5A] flex-shrink-0" />
                                <span className="text-[#1B2B1B]">
                                  {sIdx + 1}.{lIdx + 1} {lecture.title}
                                </span>
                                {lecture.duration && (
                                  <span className="text-xs text-[#5A6E5A] ml-auto">
                                    {Math.round(lecture.duration / 60)} min
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#5A6E5A]">No sections or lectures found.</p>
                )}
              </div>

              {/* Instructor */}
              <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-6">
                <h3 className="text-lg font-semibold text-[#1B2B1B] mb-3 flex items-center gap-2">
                  <User size={18} className="text-[#2E7D32]" />
                  Instructor
                </h3>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#2E7D32]/10 flex items-center justify-center flex-shrink-0">
                    {course.instructor?.profile?.avatarUrl ? (
                      <img
                        src={course.instructor.profile.avatarUrl}
                        alt=""
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <User size={20} className="text-[#5A6E5A]" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-[#1B2B1B]">
                      {course.instructor?.profile?.displayName || 'Unknown Instructor'}
                    </p>
                    <p className="text-sm text-[#5A6E5A]">{course.instructor?.email}</p>
                    {course.instructor?.profile?.bio && (
                      <p className="text-sm text-[#5A6E5A] mt-2 leading-relaxed">
                        {course.instructor.profile.bio}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right: Review Action Panel (30%) */}
        <div className="lg:w-[30%]">
          <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-6 sticky top-6 space-y-6">
            {loading ? (
              <SkeletonPanel />
            ) : (
              <>
                <div>
                  <h3 className="text-lg font-semibold text-[#1B2B1B] mb-4">Quality Checklist</h3>
                  <div className="space-y-3">
                    {checklistItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => toggleCheck(item.id)}
                        className="flex items-center gap-3 w-full text-left text-sm group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] rounded"
                      >
                        {checklist[item.id] ? (
                          <CheckSquare size={18} className="text-[#2E7D32] flex-shrink-0" />
                        ) : (
                          <Square size={18} className="text-[#5A6E5A] group-hover:text-[#2E7D32] flex-shrink-0" />
                        )}
                        <span className={checklist[item.id] ? 'text-[#1B2B1B]' : 'text-[#5A6E5A]'}>
                          {item.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-[#2E7D32]/10 pt-4">
                  <label className="block text-sm font-medium text-[#1B2B1B] mb-2">
                    Feedback / Notes
                  </label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={5}
                    placeholder="Add feedback for the instructor (required for requesting changes)..."
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#2E7D32]/20 bg-white text-[#1B2B1B] placeholder:text-[#5A6E5A]/60 focus:outline-none focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent resize-none transition-colors"
                  />
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => handleAction('approve')}
                    disabled={!allChecked || !!actionLoading}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-lg bg-[#2E7D32] text-white hover:bg-[#2E7D32]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                  >
                    {actionLoading === 'approve' ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <CheckSquare size={16} />
                    )}
                    Approve & Publish
                  </button>
                  {!allChecked && (
                    <p className="text-xs text-[#5A6E5A] text-center">
                      Complete all checklist items to approve
                    </p>
                  )}
                  <button
                    onClick={() => handleAction('reject')}
                    disabled={!!actionLoading}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-lg bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
                  >
                    {actionLoading === 'reject' && <Loader2 size={16} className="animate-spin" />}
                    Request Changes
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
