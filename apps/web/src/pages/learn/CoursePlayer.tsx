import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Menu, PlayCircle } from 'lucide-react';
import { fetchApi } from '../../lib/api';
import { HlsPlayer } from '../../components/video/HlsPlayer';
import { DownloadButton } from '../../components/video/DownloadButton';
import { OfflineBanner } from '../../components/OfflineBanner';
import { QASection } from '../../components/learn/QASection';
import { NotesSection } from '../../components/learn/NotesSection';
import { CertificateButton } from '../../components/learn/PdfCertificate';
import { ReviewModal } from '../../components/learn/ReviewModal';

export function CoursePlayer() {
  const { courseId } = useParams();
  const [data, setData] = useState<any>(null);
  const [activeLectureId, setActiveLectureId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'qa' | 'notes'>('overview');
  const [certStatus, setCertStatus] = useState<any>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const { course, progress } = await fetchApi(`/enrollments/${courseId}/content`);
        setData({ course, progress });
        
        const cert = await fetchApi(`/community/courses/${courseId}/certificate`).catch(() => null);
        if (cert) setCertStatus(cert);
        
        // Auto-select first lecture
        if (course.sections && course.sections.length > 0) {
           const firstSection = course.sections[0];
           if (firstSection.lectures && firstSection.lectures.length > 0) {
              setActiveLectureId(firstSection.lectures[0].id);
           }
        }
      } catch (e) {
        console.error("Failed to load course content", e);
      }
    }
    init();
  }, [courseId]);

  if (!data) return <div className="p-8 text-center text-text-muted">Loading API ... if offline, ensure content is cached.</div>;

  const { course } = data;
  const activeLecture = course.sections
    ?.flatMap((s: any) => s.lectures)
    .find((l: any) => l.id === activeLectureId);

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <OfflineBanner />
      
      {/* Top Navbar */}
      <header className="h-16 flex items-center px-4 bg-primary text-white sticky top-0 z-30">
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="mr-4 lg:hidden">
          <Menu size={24} />
        </button>
        <Link to="/my-library" className="text-xl font-bold truncate shrink hover:underline">{course.title}</Link>
        <div className="ml-auto flex items-center gap-4">
           {/* Progress placeholder */}
        </div>
      </header>

      <div className="flex flex-1 relative overflow-hidden">
        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-y-auto">
          {activeLecture ? (
            <div className="w-full bg-black">
              <HlsPlayer 
                lectureId={activeLecture.id} 
                onEnded={() => {
                  // TODO: Progress sync
                }}
              />
            </div>
          ) : (
             <div className="w-full aspect-video bg-black flex items-center justify-center text-white">
                Select a lecture to play
             </div>
          )}

          <div className="p-4 lg:p-8">
             <div className="flex items-start justify-between">
                <div>
                   <h1 className="text-2xl font-bold text-text-base">{activeLecture?.title}</h1>
                   <p className="text-text-muted mt-1">{activeLecture?.duration ? Math.round(activeLecture.duration / 60) + ' mins' : ''}</p>
                </div>
                {activeLecture && (
                  <DownloadButton lectureId={activeLecture.id} sizeMb={120} />
                )}
             </div>
             
             {/* Tabs placeholder */}
             <div className="mt-8 border-b border-gray-200">
                <nav className="flex gap-6 text-sm font-medium">
                   <button onClick={() => setActiveTab('overview')} className={`py-2 border-b-2 ${activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-base'}`}>Overview</button>
                   <button onClick={() => setActiveTab('qa')} className={`py-2 border-b-2 ${activeTab === 'qa' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-base'}`}>Q&A</button>
                   <button onClick={() => setActiveTab('notes')} className={`py-2 border-b-2 ${activeTab === 'notes' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-base'}`}>Notes</button>
                </nav>
             </div>
             <div className="py-6 min-h-[300px]">
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-start gap-8">
                            <p className="text-text-base whitespace-pre-wrap">{course.description}</p>
                            <button onClick={() => setIsReviewOpen(true)} className="px-4 py-2 border-2 border-primary text-primary rounded-md font-medium hover:bg-primary/5 transition-colors whitespace-nowrap shrink-0">
                                Leave a Review
                            </button>
                        </div>
                        
                        {certStatus?.eligible && (
                            <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                                <div>
                                    <h4 className="font-bold text-green-900">Congratulations!</h4>
                                    <p className="text-green-800 text-sm mt-1">You have completed all lectures in this course.</p>
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
                {activeTab === 'qa' && activeLecture && <QASection lectureId={activeLecture.id} />}
                {activeTab === 'notes' && activeLecture && <NotesSection lectureId={activeLecture.id} />}
             </div>
             
             {isReviewOpen && <ReviewModal courseId={courseId!} onClose={() => setIsReviewOpen(false)} />}
          </div>
        </main>

        {/* Sidebar */}
        <div className={`
          fixed inset-y-0 left-0 z-20 w-80 bg-surface border-r border-gray-200 transform transition-transform duration-300
          lg:static lg:translate-x-0 overflow-y-auto ${isSidebarOpen ? 'translate-x-0 mt-[64px]' : '-translate-x-full mt-[64px] lg:mt-0'}
        `}>
           <div className="p-4 bg-gray-50 border-b border-gray-200 font-semibold text-text-base flex justify-between items-center">
              <span>Course Content</span>
           </div>
           
           <div className="divide-y divide-gray-100 pb-[100px]">
             {course.sections?.map((section: any, idx: number) => (
                <div key={section.id} className="py-2">
                   <div className="px-4 py-2 font-medium text-sm text-text-base bg-gray-50 sticky top-0">
                     Section {idx + 1}: {section.title}
                   </div>
                   <div className="flex flex-col mt-1">
                     {section.lectures?.map((lecture: any) => {
                        const isActive = lecture.id === activeLectureId;
                        return (
                          <button 
                            key={lecture.id}
                            onClick={() => {
                              setActiveLectureId(lecture.id);
                              if (window.innerWidth < 1024) setIsSidebarOpen(false);
                            }}
                            className={`flex items-start gap-3 px-4 py-3 text-left transition-colors ${isActive ? 'bg-primary/10 border-l-4 border-primary' : 'hover:bg-gray-50 border-l-4 border-transparent'}`}
                          >
                             <PlayCircle size={18} className={`shrink-0 mt-0.5 ${isActive ? 'text-primary' : 'text-text-muted'}`} />
                             <div className="flex-1">
                                <span className={`text-sm block ${isActive ? 'text-primary font-medium' : 'text-text-base'}`}>{lecture.title}</span>
                                <span className="text-xs text-text-muted flex gap-2 items-center mt-1">
                                   {lecture.type === 'VIDEO' ? 'Video' : 'Article'} • {Math.round(lecture.duration / 60)}m
                                </span>
                             </div>
                          </button>
                        );
                     })}
                   </div>
                </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
}
