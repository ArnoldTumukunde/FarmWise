import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Menu,
  X,
  ArrowLeft,
  PlayCircle,
  FileText,
  HelpCircle,
  CheckCircle2,
  Download,
  ChevronDown,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { fetchApi } from '../../lib/api';
import { HlsPlayer } from '../../components/video/HlsPlayer';
import { DownloadButton } from '../../components/video/DownloadButton';
import { OfflineBanner } from '../../components/OfflineBanner';
import { QASection } from '../../components/learn/QASection';
import { NotesSection } from '../../components/learn/NotesSection';
import { CertificateButton } from '../../components/learn/PdfCertificate';
import { ReviewModal } from '../../components/learn/ReviewModal';
import { toast } from 'sonner';

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function LectureTypeIcon({ type, className }: { type: string; className?: string }) {
  switch (type) {
    case 'VIDEO':
      return <PlayCircle size={16} className={className} />;
    case 'ARTICLE':
      return <FileText size={16} className={className} />;
    case 'QUIZ':
      return <HelpCircle size={16} className={className} />;
    default:
      return <PlayCircle size={16} className={className} />;
  }
}

function SkeletonPlayer() {
  return (
    <div className="min-h-screen bg-[#FAFAF5] font-[Inter]">
      {/* Skeleton header */}
      <header className="h-14 bg-[#2E7D32] sticky top-0 z-30 flex items-center px-4 gap-3">
        <div className="w-24 h-4 bg-white/20 rounded animate-pulse" />
        <div className="ml-auto w-48 h-4 bg-white/20 rounded animate-pulse" />
      </header>
      <div className="flex flex-1">
        <main className="flex-1">
          {/* Skeleton video */}
          <div className="w-full aspect-video bg-[#1A2E1A] animate-pulse" />
          <div className="p-4 lg:p-8 space-y-4">
            <div className="w-72 h-7 bg-gray-200 rounded animate-pulse" />
            <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
            <div className="flex gap-6 border-b border-gray-200 pb-2 mt-6">
              <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
              <div className="w-12 h-4 bg-gray-200 rounded animate-pulse" />
              <div className="w-14 h-4 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="space-y-3 pt-4">
              <div className="w-full h-4 bg-gray-200 rounded animate-pulse" />
              <div className="w-5/6 h-4 bg-gray-200 rounded animate-pulse" />
              <div className="w-4/6 h-4 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </main>
        {/* Skeleton sidebar - desktop only */}
        <aside className="hidden lg:block w-80 border-l border-gray-200 bg-white">
          <div className="p-4 border-b border-gray-200">
            <div className="w-32 h-5 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="space-y-2">
                <div className="w-40 h-4 bg-gray-200 rounded animate-pulse" />
                <div className="w-full h-3 bg-gray-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

export function CoursePlayer() {
  const { courseId } = useParams();
  const [data, setData] = useState<any>(null);
  const [activeLectureId, setActiveLectureId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'qa' | 'notes'>('overview');
  const [certStatus, setCertStatus] = useState<any>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const watchedSecondsRef = useRef(0);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const syncProgressToServer = useCallback(
    async (lectureId: string, enrollmentId: string, isCompleted: boolean) => {
      try {
        await fetchApi('/learn/progress/sync', {
          method: 'POST',
          body: JSON.stringify({
            records: [
              {
                lectureId,
                enrollmentId,
                isCompleted,
                watchedSeconds: Math.floor(watchedSecondsRef.current),
              },
            ],
          }),
        });
      } catch (e) {
        console.error('Failed to sync progress', e);
      }
    },
    []
  );

  // Periodic progress saving every 30 seconds
  useEffect(() => {
    if (!activeLectureId || !data?.enrollmentId) return;

    const enrollmentId = data.enrollmentId;
    const lectureId = activeLectureId;

    progressIntervalRef.current = setInterval(() => {
      if (watchedSecondsRef.current > 0) {
        syncProgressToServer(lectureId, enrollmentId, false);
      }
    }, 30_000);

    return () => {
      // Save progress on lecture change / unmount
      if (watchedSecondsRef.current > 0) {
        syncProgressToServer(lectureId, enrollmentId, false);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      watchedSecondsRef.current = 0;
    };
  }, [activeLectureId, data?.enrollmentId, syncProgressToServer]);

  useEffect(() => {
    async function init() {
      try {
        const { course, progress, enrollmentId } = await fetchApi(`/enrollments/${courseId}/content`);
        setData({ course, progress, enrollmentId });

        const cert = await fetchApi(`/community/courses/${courseId}/certificate`).catch(() => null);
        if (cert) setCertStatus(cert);

        // Auto-select first lecture and expand all sections
        if (course.sections && course.sections.length > 0) {
          const allSectionIds = new Set(course.sections.map((s: any) => s.id));
          setExpandedSections(allSectionIds as Set<string>);
          const firstSection = course.sections[0];
          if (firstSection.lectures && firstSection.lectures.length > 0) {
            setActiveLectureId(firstSection.lectures[0].id);
          }
        }
      } catch (e) {
        console.error('Failed to load course content', e);
        setError('Failed to load course content. Please try again.');
      }
    }
    init();
  }, [courseId]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#FAFAF5] font-[Inter] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <p className="text-red-600 font-medium text-lg mb-4">{error}</p>
          <Link
            to="/my-library"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2E7D32] text-white rounded-lg font-medium hover:bg-[#256829] transition-colors"
          >
            <ArrowLeft size={18} />
            Back to My Learning
          </Link>
        </div>
      </div>
    );
  }

  if (!data) return <SkeletonPlayer />;

  const { course, progress } = data;
  const completedLectures = new Set(progress?.completedLectureIds || []);
  const activeLecture = course.sections
    ?.flatMap((s: any) => s.lectures)
    .find((l: any) => l.id === activeLectureId);

  const totalLectures = course.sections?.reduce(
    (sum: number, s: any) => sum + (s.lectures?.length || 0),
    0
  ) || 0;

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  const tabs = [
    { key: 'overview' as const, label: 'Overview' },
    { key: 'qa' as const, label: 'Q&A' },
    { key: 'notes' as const, label: 'Notes' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAF5] font-[Inter]">
      <OfflineBanner />

      {/* Sticky Header */}
      <header className="h-14 flex items-center px-4 bg-[#2E7D32] text-white sticky top-0 z-30 shadow-md">
        <Link
          to="/my-library"
          className="flex items-center gap-2 text-sm font-medium text-white/90 hover:text-white transition-colors mr-4 shrink-0 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#2E7D32] rounded"
        >
          <ArrowLeft size={18} />
          <span className="hidden sm:inline">My Learning</span>
        </Link>

        <div className="h-5 w-px bg-white/30 mr-4 hidden sm:block" />

        <h1 className="text-sm font-semibold truncate flex-1" title={course.title}>{course.title}</h1>

        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="lg:hidden ml-3 p-2 rounded-md hover:bg-white/10 transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#2E7D32]"
          aria-label="Open course content"
        >
          <Menu size={20} />
        </button>
      </header>

      <div className="flex flex-1 relative overflow-hidden">
        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-y-auto">
          {/* Video Area */}
          {activeLecture ? (
            <div className="w-full bg-[#1A2E1A]">
              <div className="max-w-5xl mx-auto">
                <div className="aspect-video">
                  <HlsPlayer
                    lectureId={activeLecture.id}
                    onProgress={(seconds) => {
                      watchedSecondsRef.current = seconds;
                    }}
                    onEnded={async () => {
                      const enrollmentId = data?.enrollmentId;
                      if (!enrollmentId) return;
                      try {
                        await syncProgressToServer(activeLecture.id, enrollmentId, true);
                        // Update local completed set
                        setData((prev: any) => {
                          if (!prev) return prev;
                          const ids = new Set(prev.progress?.completedLectureIds || []);
                          ids.add(activeLecture.id);
                          return {
                            ...prev,
                            progress: {
                              ...prev.progress,
                              completedLectureIds: Array.from(ids),
                            },
                          };
                        });
                        toast.success('Lecture completed!');
                      } catch (e) {
                        console.error('Failed to mark lecture completed', e);
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full aspect-video bg-[#1A2E1A] flex items-center justify-center text-white/60">
              <div className="text-center">
                <PlayCircle size={48} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm">Select a lecture to begin</p>
              </div>
            </div>
          )}

          {/* Below Video Content */}
          <div className="p-4 lg:p-8 max-w-5xl mx-auto w-full">
            {/* Lecture title + download */}
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-xl lg:text-2xl font-bold text-[#1B2B1B] leading-tight">
                  {activeLecture?.title || 'Select a lecture'}
                </h2>
                {activeLecture?.duration && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-[#5A6E5A] text-sm">
                    <Clock size={14} />
                    <span>{formatDuration(activeLecture.duration)}</span>
                  </div>
                )}
              </div>
              {activeLecture && (
                <div className="shrink-0">
                  <DownloadButton lectureId={activeLecture.id} sizeMb={120} />
                </div>
              )}
            </div>

            {/* Tab Bar */}
            <div className="mt-6 border-b border-gray-200">
              <nav className="flex gap-0" role="tablist">
                {tabs.map(tab => (
                  <button
                    key={tab.key}
                    role="tab"
                    aria-selected={activeTab === tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`
                      relative px-5 py-3 text-sm font-medium transition-colors
                      focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2 rounded-t
                      ${
                        activeTab === tab.key
                          ? 'text-[#2E7D32]'
                          : 'text-[#5A6E5A] hover:text-[#1B2B1B]'
                      }
                    `}
                  >
                    {tab.label}
                    {activeTab === tab.key && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2E7D32] rounded-full" />
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="py-6 min-h-[300px]">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <p className="text-[#1B2B1B] whitespace-pre-wrap leading-relaxed text-sm lg:text-base flex-1">
                      {course.description}
                    </p>
                    <button
                      onClick={() => setIsReviewOpen(true)}
                      className="px-5 py-2.5 border-2 border-[#2E7D32] text-[#2E7D32] rounded-lg font-medium hover:bg-[#2E7D32]/5 transition-colors whitespace-nowrap shrink-0 focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                    >
                      Leave a Review
                    </button>
                  </div>

                  {certStatus?.eligible && (
                    <div className="p-5 bg-[#2E7D32]/10 border border-[#2E7D32]/20 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-[#2E7D32] text-lg">
                          Congratulations!
                        </h4>
                        <p className="text-[#2E7D32]/80 text-sm mt-1">
                          You have completed all lectures. Your certificate is ready.
                        </p>
                      </div>
                      <CertificateButton
                        studentName={certStatus.studentName}
                        courseName={certStatus.courseName}
                        completedAt={new Date(certStatus.completedAt).toLocaleDateString()}
                      />
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'qa' && activeLecture && (
                <QASection lectureId={activeLecture.id} />
              )}
              {activeTab === 'notes' && activeLecture && (
                <NotesSection lectureId={activeLecture.id} />
              )}
            </div>

            {isReviewOpen && (
              <ReviewModal courseId={courseId!} onClose={() => setIsReviewOpen(false)} />
            )}
          </div>
        </main>

        {/* Mobile Sidebar Overlay Backdrop */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar - right side on desktop, slides from right on mobile */}
        <aside
          className={`
            fixed top-14 right-0 bottom-0 z-50 w-80 bg-white border-l border-gray-200
            transform transition-transform duration-300 ease-in-out overflow-y-auto
            lg:static lg:top-auto lg:right-auto lg:bottom-auto lg:z-auto lg:translate-x-0 lg:shrink-0
            ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
          `}
        >
          {/* Sidebar Header */}
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between sticky top-0 z-10">
            <div>
              <h3 className="font-semibold text-[#1B2B1B] text-sm">Course Content</h3>
              <p className="text-xs text-[#5A6E5A] mt-0.5">
                {totalLectures} lecture{totalLectures !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-md hover:bg-gray-200 transition-colors focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
              aria-label="Close sidebar"
            >
              <X size={18} />
            </button>
          </div>

          {/* Sections & Lectures */}
          <div className="pb-20">
            {course.sections?.map((section: any, idx: number) => {
              const isExpanded = expandedSections.has(section.id);
              const lectureCount = section.lectures?.length || 0;
              const completedInSection =
                section.lectures?.filter((l: any) => completedLectures.has(l.id)).length || 0;

              return (
                <div key={section.id} className="border-b border-gray-100">
                  {/* Section Header */}
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center gap-2 px-4 py-3 bg-gray-50/80 hover:bg-gray-100 transition-colors text-left focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                  >
                    {isExpanded ? (
                      <ChevronDown size={16} className="text-[#5A6E5A] shrink-0" />
                    ) : (
                      <ChevronRight size={16} className="text-[#5A6E5A] shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-bold text-[#1B2B1B] block truncate">
                        Section {idx + 1}: {section.title}
                      </span>
                      <span className="text-xs text-[#5A6E5A]">
                        {completedInSection}/{lectureCount} lecture{lectureCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </button>

                  {/* Lectures */}
                  {isExpanded && (
                    <div className="flex flex-col">
                      {section.lectures?.map((lecture: any) => {
                        const isActive = lecture.id === activeLectureId;
                        const isCompleted = completedLectures.has(lecture.id);

                        return (
                          <button
                            key={lecture.id}
                            onClick={() => {
                              setActiveLectureId(lecture.id);
                              if (window.innerWidth < 1024) setIsSidebarOpen(false);
                            }}
                            className={`
                              flex items-start gap-3 px-4 py-3 text-left transition-colors border-l-[3px]
                              focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2 focus-visible:ring-inset
                              ${
                                isActive
                                  ? 'bg-[#2E7D32]/10 border-l-[#2E7D32]'
                                  : 'hover:bg-gray-50 border-l-transparent'
                              }
                            `}
                          >
                            {/* Completion or type icon */}
                            <div className="shrink-0 mt-0.5">
                              {isCompleted ? (
                                <CheckCircle2
                                  size={16}
                                  className="text-[#4CAF50]"
                                />
                              ) : (
                                <LectureTypeIcon
                                  type={lecture.type}
                                  className={
                                    isActive ? 'text-[#2E7D32]' : 'text-[#5A6E5A]'
                                  }
                                />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <span
                                className={`text-sm block truncate ${
                                  isActive
                                    ? 'text-[#2E7D32] font-medium'
                                    : 'text-[#1B2B1B]'
                                }`}
                              >
                                {lecture.title}
                              </span>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-[#5A6E5A]">
                                  {lecture.type === 'VIDEO'
                                    ? 'VIDEO'
                                    : lecture.type === 'ARTICLE'
                                    ? 'ARTICLE'
                                    : 'QUIZ'}
                                </span>
                                {lecture.duration > 0 && (
                                  <>
                                    <span className="text-xs text-[#5A6E5A]">·</span>
                                    <span className="text-xs text-[#5A6E5A]">
                                      {formatDuration(lecture.duration)}
                                    </span>
                                  </>
                                )}
                                {lecture.downloadable && (
                                  <Download size={12} className="text-[#5A6E5A]" />
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}
