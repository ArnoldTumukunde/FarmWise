import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Menu,
  X,
  ArrowLeft,
  PlayCircle,
  FileText,
  FileType2,
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
import { PdfViewerModal } from '../../components/learn/PdfViewerModal';
import { CertificateButton } from '../../components/learn/PdfCertificate';
import { ReviewModal } from '../../components/learn/ReviewModal';
import { toast } from 'sonner';
import { downloadCourse, deleteCourseDownloads, getDownloadStatus } from '../../offline/downloadManager';

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
    case 'PDF':
      return <FileType2 size={16} className={className} />;
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
  const [courseDownload, setCourseDownload] = useState<{ downloading: boolean; completed: number; total: number } | null>(null);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);

  const handleDownloadCourse = useCallback(async () => {
    if (!data?.course?.sections) return;
    setCourseDownload({ downloading: true, completed: 0, total: 0 });
    try {
      await downloadCourse(data.course.sections, (completed, total) => {
        setCourseDownload({ downloading: true, completed, total });
      });
      setCourseDownload(null);
      toast.success('Course downloaded for offline viewing');
    } catch {
      setCourseDownload(null);
      toast.error('Some lectures failed to download');
    }
  }, [data]);

  const handleDeleteCourseDownload = useCallback(async () => {
    if (!data?.course?.sections) return;
    await deleteCourseDownloads(data.course.sections);
    toast.success('Offline downloads removed');
  }, [data]);
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
    const lectureDuration = data?.course?.sections
      ?.flatMap((s: any) => s.lectures || [])
      ?.find((l: any) => l.id === lectureId)?.duration || 0;

    progressIntervalRef.current = setInterval(() => {
      if (watchedSecondsRef.current > 0) {
        // Auto-complete at 90% watched (sticky on backend so safe to send true)
        const reachedThreshold = lectureDuration > 0 && watchedSecondsRef.current >= lectureDuration * 0.9;
        syncProgressToServer(lectureId, enrollmentId, reachedThreshold);
      }
    }, 30_000);

    return () => {
      if (watchedSecondsRef.current > 0) {
        const reachedThreshold = lectureDuration > 0 && watchedSecondsRef.current >= lectureDuration * 0.9;
        syncProgressToServer(lectureId, enrollmentId, reachedThreshold);
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
          {/* Content Area — changes based on lecture type */}
          {activeLecture ? (
            activeLecture.type === 'VIDEO' ? (
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
            ) : activeLecture.type === 'ARTICLE' ? (
              <ArticleContent
                lecture={activeLecture}
                enrollmentId={data?.enrollmentId}
                onComplete={async () => {
                  if (!data?.enrollmentId) return;
                  try {
                    await syncProgressToServer(activeLecture.id, data.enrollmentId, true);
                    setData((prev: any) => {
                      if (!prev) return prev;
                      const ids = new Set(prev.progress?.completedLectureIds || []);
                      ids.add(activeLecture.id);
                      return { ...prev, progress: { ...prev.progress, completedLectureIds: Array.from(ids) } };
                    });
                    toast.success('Article completed!');
                  } catch (e) {
                    console.error('Failed to mark article completed', e);
                  }
                }}
                isCompleted={completedLectures.has(activeLecture.id)}
              />
            ) : activeLecture.type === 'QUIZ' ? (
              <QuizContent
                lecture={activeLecture}
                enrollmentId={data?.enrollmentId}
                onComplete={async () => {
                  if (!data?.enrollmentId) return;
                  try {
                    await syncProgressToServer(activeLecture.id, data.enrollmentId, true);
                    setData((prev: any) => {
                      if (!prev) return prev;
                      const ids = new Set(prev.progress?.completedLectureIds || []);
                      ids.add(activeLecture.id);
                      return { ...prev, progress: { ...prev.progress, completedLectureIds: Array.from(ids) } };
                    });
                    toast.success('Quiz completed!');
                  } catch (e) {
                    console.error('Failed to mark quiz completed', e);
                  }
                }}
                isCompleted={completedLectures.has(activeLecture.id)}
              />
            ) : activeLecture.type === 'PDF' ? (
              <div className="max-w-3xl mx-auto px-6 py-12 w-full">
                <div className="bg-white border border-[#2E7D32]/10 rounded-xl p-8 text-center shadow-sm">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-rose-50 text-rose-600 mb-4">
                    <FileType2 size={28} />
                  </div>
                  <h2 className="text-xl font-semibold text-[#1B2B1B]">{activeLecture.title}</h2>
                  <p className="text-sm text-[#5A6E5A] mt-2">
                    {activeLecture.pdfPageCount
                      ? `${activeLecture.pdfPageCount}-page document`
                      : 'PDF document'}{' '}
                    — open the reader to view in your browser.
                  </p>
                  <button
                    onClick={() => setPdfModalOpen(true)}
                    className="inline-flex items-center gap-2 px-6 py-2.5 mt-6 bg-[#2E7D32] text-white font-medium rounded-lg hover:bg-[#2E7D32]/90 transition-colors text-sm focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                  >
                    <FileType2 size={16} />
                    Open PDF
                  </button>
                  <p className="text-xs text-[#5A6E5A] mt-3">Read-only — downloading is disabled.</p>
                </div>
              </div>
            ) : (
              <div className="w-full bg-[#1A2E1A] aspect-video flex items-center justify-center text-white/60">
                <p className="text-sm">Unsupported lecture type</p>
              </div>
            )
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
                <NotesSection lectureId={activeLecture.id} getCurrentTime={() => Math.floor(watchedSecondsRef.current)} />
              )}
            </div>

            {isReviewOpen && (
              <ReviewModal courseId={courseId!} onClose={() => setIsReviewOpen(false)} />
            )}

            {activeLecture && activeLecture.type === 'PDF' && (
              <PdfViewerModal
                lectureId={activeLecture.id}
                title={activeLecture.title}
                open={pdfModalOpen}
                onClose={() => setPdfModalOpen(false)}
                onLastPageReached={async () => {
                  if (!data?.enrollmentId) return;
                  if (completedLectures.has(activeLecture.id)) return;
                  try {
                    await syncProgressToServer(activeLecture.id, data.enrollmentId, true);
                    setData((prev: any) => {
                      if (!prev) return prev;
                      const ids = new Set(prev.progress?.completedLectureIds || []);
                      ids.add(activeLecture.id);
                      return {
                        ...prev,
                        progress: { ...prev.progress, completedLectureIds: Array.from(ids) },
                      };
                    });
                    toast.success('PDF completed!');
                  } catch (e) {
                    console.error('Failed to mark PDF completed', e);
                  }
                }}
              />
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

          {/* Download entire course */}
          {data?.course?.isOfflineEnabled && (
            <div className="px-4 py-3 border-b border-gray-200">
              {courseDownload?.downloading ? (
                <div className="flex items-center gap-2 text-xs text-[#5A6E5A]">
                  <Download size={14} className="animate-pulse text-[#2E7D32]" />
                  <span>Downloading {courseDownload.completed}/{courseDownload.total} lectures...</span>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleDownloadCourse}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-[#2E7D32] bg-[#2E7D32]/10 hover:bg-[#2E7D32]/20 rounded-lg py-2 transition-colors"
                  >
                    <Download size={14} />
                    Download Course
                  </button>
                  <button
                    onClick={handleDeleteCourseDownload}
                    className="flex items-center justify-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg px-3 py-2 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          )}

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
                                <span className="text-xs text-[#5A6E5A]">{lecture.type}</span>
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

/* ───── Article Content ───── */
function ArticleContent({
  lecture,
  onComplete,
  isCompleted,
}: {
  lecture: any;
  enrollmentId?: string;
  onComplete: () => void;
  isCompleted: boolean;
}) {
  return (
    <div className="w-full bg-white">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={20} className="text-[#2E7D32]" />
          <span className="text-sm font-medium text-[#5A6E5A]">Article</span>
        </div>
        <div
          className="prose prose-sm max-w-none text-[#1B2B1B] leading-relaxed"
          dangerouslySetInnerHTML={{ __html: lecture.content || '<p class="text-[#5A6E5A] italic">No content available for this article.</p>' }}
        />
        {!isCompleted && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={onComplete}
              className="px-6 py-2.5 bg-[#2E7D32] text-white font-semibold rounded-lg hover:bg-[#256829] transition-colors"
            >
              Mark as Complete
            </button>
          </div>
        )}
        {isCompleted && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-2 text-[#4CAF50]">
              <CheckCircle2 size={18} />
              <span className="text-sm font-medium">Completed</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ───── Quiz Content ───── */
function QuizContent({
  lecture,
  onComplete,
  isCompleted,
}: {
  lecture: any;
  enrollmentId?: string;
  onComplete: () => void;
  isCompleted: boolean;
}) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  const quizData = lecture.quizData as any;
  // quizData can be either a direct array of questions or an object with a questions property
  const questions: Array<{
    question: string;
    options: string[];
    correctIndex: number;
    explanation?: string;
  }> = Array.isArray(quizData)
    ? quizData
    : Array.isArray(quizData?.questions)
      ? quizData.questions
      : [];

  if (questions.length === 0) {
    return (
      <div className="w-full bg-white">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle size={20} className="text-[#2E7D32]" />
            <span className="text-sm font-medium text-[#5A6E5A]">Quiz</span>
          </div>
          <p className="text-[#5A6E5A] italic">No quiz questions available yet.</p>
          {!isCompleted && (
            <button
              onClick={onComplete}
              className="mt-4 px-6 py-2.5 bg-[#2E7D32] text-white font-semibold rounded-lg hover:bg-[#256829] transition-colors"
            >
              Mark as Complete
            </button>
          )}
        </div>
      </div>
    );
  }

  const handleSubmit = () => {
    let correct = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.correctIndex) correct++;
    });
    setScore(correct);
    setSubmitted(true);
    if (correct >= Math.ceil(questions.length * 0.6)) {
      onComplete();
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    setScore(null);
  };

  return (
    <div className="w-full bg-white">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center gap-2 mb-6">
          <HelpCircle size={20} className="text-[#2E7D32]" />
          <span className="text-sm font-medium text-[#5A6E5A]">
            Quiz · {questions.length} question{questions.length !== 1 ? 's' : ''}
          </span>
          {isCompleted && (
            <span className="ml-auto flex items-center gap-1 text-[#4CAF50] text-sm font-medium">
              <CheckCircle2 size={16} /> Completed
            </span>
          )}
        </div>

        <div className="space-y-6">
          {questions.map((q, qi) => {
            const userAnswer = answers[qi];

            return (
              <div key={qi} className="border border-gray-200 rounded-xl p-5">
                <p className="text-sm font-semibold text-[#1B2B1B] mb-3">
                  {qi + 1}. {q.question}
                </p>
                <div className="space-y-2">
                  {q.options.map((opt, oi) => {
                    const isSelected = userAnswer === oi;
                    const showCorrect = submitted && oi === q.correctIndex;
                    const showWrong = submitted && isSelected && oi !== q.correctIndex;

                    return (
                      <button
                        key={oi}
                        onClick={() => {
                          if (submitted) return;
                          setAnswers(prev => ({ ...prev, [qi]: oi }));
                        }}
                        disabled={submitted}
                        className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg border text-sm transition-colors
                          ${showCorrect ? 'border-[#4CAF50] bg-[#4CAF50]/10 text-[#2E7D32]'
                          : showWrong ? 'border-red-400 bg-red-50 text-red-700'
                          : isSelected ? 'border-[#2E7D32] bg-[#2E7D32]/5 text-[#1B2B1B]'
                          : 'border-gray-200 hover:border-gray-300 text-[#1B2B1B]'}`}
                      >
                        <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-xs font-bold
                          ${showCorrect ? 'border-[#4CAF50] bg-[#4CAF50] text-white'
                          : showWrong ? 'border-red-400 bg-red-400 text-white'
                          : isSelected ? 'border-[#2E7D32] bg-[#2E7D32] text-white'
                          : 'border-gray-300'}`}>
                          {String.fromCharCode(65 + oi)}
                        </span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {submitted && q.explanation && (
                  <p className="text-xs text-[#5A6E5A] mt-3 bg-gray-50 rounded-lg p-3">
                    {q.explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          {!submitted ? (
            <button
              onClick={handleSubmit}
              disabled={Object.keys(answers).length < questions.length}
              className="px-6 py-2.5 bg-[#2E7D32] text-white font-semibold rounded-lg hover:bg-[#256829] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Answers
            </button>
          ) : (
            <div className="flex items-center gap-4">
              <div className={`text-lg font-bold ${score! >= Math.ceil(questions.length * 0.6) ? 'text-[#4CAF50]' : 'text-red-500'}`}>
                {score}/{questions.length} correct
                {score! >= Math.ceil(questions.length * 0.6) ? ' — Passed!' : ' — Try again'}
              </div>
              {score! < Math.ceil(questions.length * 0.6) && (
                <button
                  onClick={handleRetry}
                  className="px-5 py-2 border border-[#2E7D32] text-[#2E7D32] font-semibold rounded-lg hover:bg-[#2E7D32]/5 transition-colors text-sm"
                >
                  Retry
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
