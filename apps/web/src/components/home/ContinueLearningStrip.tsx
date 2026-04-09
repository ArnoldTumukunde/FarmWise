import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fetchApi } from '@/lib/api';
import { cloudinaryImageUrl } from '@/lib/utils';
import { Play, PlayCircle, Sprout } from 'lucide-react';

interface ResumeEnrollment {
  course: {
    slug: string;
    title: string;
    thumbnailPublicId: string | null;
  };
  lastLectureId?: string;
  lastLectureTitle?: string;
  lastLectureDuration?: number;
}

function formatDuration(seconds?: number): string {
  if (!seconds) return '';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
}

export function HomeContinueLearningStrip() {
  const [enrollments, setEnrollments] = useState<ResumeEnrollment[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchApi('/enrollments')
      .then(res => {
        const all = res.enrollments || [];
        const inProgress = all
          .filter((e: any) => (e.progressPercent || 0) > 0 && (e.progressPercent || 0) < 100)
          .sort((a: any, b: any) =>
            new Date(b.lastAccessedAt || 0).getTime() - new Date(a.lastAccessedAt || 0).getTime()
          )
          .slice(0, 3)
          .map((e: any) => ({
            course: {
              slug: e.course.slug,
              title: e.course.title,
              thumbnailPublicId: e.course.thumbnailPublicId,
            },
            lastLectureId: e.lastLectureId,
            lastLectureTitle: e.lastLectureTitle,
            lastLectureDuration: e.lastLectureDuration,
          }));
        setEnrollments(inProgress);
      })
      .catch(() => {});
  }, []);

  if (enrollments.length === 0) return null;

  return (
    <div className="px-4 md:px-6 lg:px-10 py-6 border-t border-gray-100">
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-text-base">Let&apos;s continue learning</h2>
        <Link to="/my-learning" className="text-sm font-semibold text-primary hover:underline">
          My learning &rarr;
        </Link>
      </div>

      {/* Resume cards */}
      <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-hide">
        {enrollments.map((enrollment) => {
          const learnPath = `/learn/${enrollment.course.slug}${enrollment.lastLectureId ? `/${enrollment.lastLectureId}` : ''}`;
          return (
            <div
              key={enrollment.course.slug}
              onClick={() => navigate(learnPath)}
              className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer w-[380px] flex-shrink-0"
            >
              {/* Lecture thumbnail with play button overlay */}
              <div className="relative w-[120px] h-[68px] rounded overflow-hidden flex-shrink-0 bg-gray-200">
                {enrollment.course.thumbnailPublicId ? (
                  <img
                    src={cloudinaryImageUrl(enrollment.course.thumbnailPublicId, 240, 136)}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                    <Sprout size={18} className="text-primary/30" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center">
                    <Play size={14} className="text-text-base ml-0.5" fill="#1B2B1B" />
                  </div>
                </div>
              </div>

              {/* Text content */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-text-muted truncate">{enrollment.course.title}</p>
                <p className="text-sm font-semibold text-text-base leading-snug line-clamp-2 mt-0.5">
                  {enrollment.lastLectureTitle || 'Next lecture'}
                </p>
                <p className="text-xs text-text-muted mt-1 flex items-center gap-1">
                  <PlayCircle size={11} />
                  Lecture{enrollment.lastLectureDuration ? ` · ${formatDuration(enrollment.lastLectureDuration)}` : ''}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
