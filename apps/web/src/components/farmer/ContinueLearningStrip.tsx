import { useNavigate, Link } from 'react-router-dom';
import { cloudinaryImageUrl } from '@/lib/utils';
import { Play, Sprout } from 'lucide-react';

interface ContinueCourse {
  slug: string;
  title: string;
  thumbnailPublicId: string | null;
  lastLectureId?: string;
  lastLectureTitle?: string;
  lastSectionTitle?: string;
  lectureDuration?: number;
}

interface ContinueLearningStripProps {
  courses: ContinueCourse[];
  heading?: string;
  linkLabel?: string;
  linkHref?: string;
}

export function ContinueLearningStrip({
  courses,
  heading = 'Continue learning',
  linkLabel = 'My learning →',
  linkHref = '/my-learning',
}: ContinueLearningStripProps) {
  const navigate = useNavigate();

  if (courses.length === 0) return null;

  return (
    <div className="px-4 md:px-6 lg:px-10 py-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-text-base">{heading}</h2>
        <Link to={linkHref} className="text-sm font-semibold text-primary hover:underline">
          {linkLabel}
        </Link>
      </div>

      <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-hide">
        {courses.slice(0, 3).map((course) => {
          const learnPath = `/learn/${course.slug}${course.lastLectureId ? `/${course.lastLectureId}` : ''}`;
          const durationMin = course.lectureDuration ? Math.round(course.lectureDuration / 60) : null;

          return (
            <div
              key={course.slug}
              onClick={() => navigate(learnPath)}
              className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer w-[380px] flex-shrink-0"
            >
              {/* Thumbnail with play overlay */}
              <div className="w-20 h-14 rounded overflow-hidden flex-shrink-0 relative">
                {course.thumbnailPublicId ? (
                  <img
                    src={cloudinaryImageUrl(course.thumbnailPublicId, 160, 112)}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                    <Sprout size={16} className="text-primary/30" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <Play size={18} fill="white" className="text-white" />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-text-base line-clamp-1">{course.title}</p>
                <p className="text-xs text-text-muted line-clamp-1 mt-0.5">
                  {course.lastSectionTitle && `${course.lastSectionTitle} · `}
                  {course.lastLectureTitle || 'Next lecture'}
                </p>
                <p className="text-[11px] text-text-muted mt-1 flex items-center gap-1">
                  <Play size={9} fill="currentColor" />
                  Lecture{durationMin ? ` · ${durationMin}m` : ''}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
