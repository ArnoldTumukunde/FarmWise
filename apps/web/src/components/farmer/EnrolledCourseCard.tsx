import { useNavigate } from 'react-router-dom';
import { cloudinaryImageUrl } from '@/lib/utils';

export interface EnrolledCourseData {
  id: string;
  courseId: string;
  course: {
    id: string;
    slug: string;
    title: string;
    thumbnailPublicId: string | null;
    instructor: { name?: string; profile?: { displayName: string } };
  };
  progress: number; // 0–100
  lastWatchedLecture?: {
    id: string;
    title: string;
  };
  lastAccessedAt?: string;
}

function getInstructorName(instructor: EnrolledCourseData['course']['instructor']): string {
  return instructor?.profile?.displayName || instructor?.name || 'Instructor';
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function EnrolledCourseCard({ enrollment }: { enrollment: EnrolledCourseData }) {
  const navigate = useNavigate();
  const { course, progress, lastWatchedLecture, lastAccessedAt } = enrollment;
  const instructorName = getInstructorName(course.instructor);
  const pct = Math.min(Math.round(progress), 100);

  const handleContinue = () => {
    if (lastWatchedLecture) {
      navigate(`/learn/${course.id}?lecture=${lastWatchedLecture.id}`);
    } else {
      navigate(`/learn/${course.id}`);
    }
  };

  return (
    <div
      className="bg-white rounded-lg overflow-hidden cursor-pointer group transition-shadow duration-150 hover:shadow-lg"
      role="article"
      aria-label={course.title}
      onClick={handleContinue}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        {course.thumbnailPublicId ? (
          <img
            src={cloudinaryImageUrl(course.thumbnailPublicId, 480, 270)}
            alt={course.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary-light/10 flex items-center justify-center text-text-muted text-sm">
            Course
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-3">
        <h3 className="text-sm font-semibold text-text-base leading-snug line-clamp-2 mb-1">
          {course.title}
        </h3>
        <p className="text-xs text-text-muted mb-3 truncate">{instructorName}</p>

        {/* Progress bar */}
        <div className="space-y-1 mb-3">
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <div className="flex justify-between text-[11px] text-text-muted">
            <span>{pct}% complete</span>
            {lastWatchedLecture && lastAccessedAt && (
              <span className="truncate ml-2">
                {lastWatchedLecture.title} &middot; {relativeTime(lastAccessedAt)}
              </span>
            )}
          </div>
        </div>

        {/* Continue button */}
        <button
          className="w-full bg-primary hover:bg-primary-light text-white text-sm font-semibold py-2 rounded transition-colors duration-150 active:scale-[0.98]"
          onClick={(e) => {
            e.stopPropagation();
            handleContinue();
          }}
        >
          {pct > 0 ? 'Continue' : 'Start Learning'} &rarr;
        </button>
      </div>
    </div>
  );
}
