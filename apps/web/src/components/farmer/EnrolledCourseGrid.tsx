import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cloudinaryImageUrl } from '@/lib/utils';
import { StarRating } from '@/components/ui/StarRating';
import {
  MoreHorizontal, Play, ExternalLink, Download, Archive, Share2, Star,
  Sprout, Search,
} from 'lucide-react';
import { toast } from 'sonner';

export interface EnrolledCourse {
  id: string;
  enrollmentId: string;
  slug: string;
  title: string;
  thumbnailPublicId: string | null;
  instructor: { name: string };
  completionPercent: number;
  userRating?: number;
  lastLectureId?: string;
  lastAccessedAt?: string;
}

interface EnrolledCourseGridProps {
  courses: EnrolledCourse[];
  viewMode: 'grid' | 'list';
  onClearFilters: () => void;
  hasEnrollments: boolean;
}

export function EnrolledCourseGrid({ courses, viewMode, onClearFilters, hasEnrollments }: EnrolledCourseGridProps) {
  if (!hasEnrollments) {
    return (
      <div className="text-center py-16 px-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sprout size={28} className="text-primary" />
        </div>
        <h3 className="text-lg font-bold text-text-base mb-2">Start learning</h3>
        <p className="text-sm text-text-muted mb-6 max-w-xs mx-auto">
          When you enroll in a course, it will appear here.
          Browse our catalog to find courses that match your farming interests.
        </p>
        <a
          href="/courses"
          className="bg-primary text-white font-semibold px-8 py-3 rounded-lg hover:bg-primary-light transition-colors inline-block"
        >
          Browse courses
        </a>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <Search size={40} className="text-gray-300 mx-auto mb-3" />
        <p className="text-base font-semibold text-text-base">No courses match your filters</p>
        <p className="text-sm text-text-muted mt-1 mb-4">Try adjusting your filters or search query</p>
        <button
          onClick={onClearFilters}
          className="text-sm font-semibold text-primary hover:underline underline-offset-2"
        >
          Clear all filters
        </button>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="px-4 md:px-6 lg:px-10 pb-8">
        <div className="divide-y divide-gray-100">
          {courses.map(course => (
            <EnrolledCourseListItem key={course.enrollmentId} course={course} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-4 md:px-6 lg:px-10 pb-8">
      {courses.map(course => (
        <EnrolledCourseGridCard key={course.enrollmentId} course={course} />
      ))}
    </div>
  );
}

/* ───── Grid Card ───── */
function EnrolledCourseGridCard({ course }: { course: EnrolledCourse }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const learnPath = `/learn/${course.slug}${course.lastLectureId ? `/${course.lastLectureId}` : ''}`;

  return (
    <div className="bg-white rounded-lg overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        {course.thumbnailPublicId ? (
          <img
            src={cloudinaryImageUrl(course.thumbnailPublicId, 480, 270)}
            alt={course.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Sprout size={32} className="text-primary/30" />
          </div>
        )}
        {/* Three-dot menu — always visible */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={e => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
            className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors z-10"
          >
            <MoreHorizontal size={15} className="text-text-base" />
          </button>
          {menuOpen && (
            <div className="absolute top-10 right-2 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-52 z-20">
              <MenuOption icon={<Play size={14} />} label="Continue course" onClick={() => navigate(learnPath)} />
              <MenuOption icon={<ExternalLink size={14} />} label="Course details" onClick={() => navigate(`/course/${course.slug}`)} />
              <MenuOption icon={<Download size={14} />} label="Download all lectures" onClick={() => toast.info('Download queued')} />
              <MenuOption icon={<Archive size={14} />} label="Archive" onClick={() => toast.info('Course archived')} />
              <MenuOption icon={<Share2 size={14} />} label="Share" onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/course/${course.slug}`);
                toast.success('Link copied!');
              }} />
            </div>
          )}
        </div>
      </div>

      {/* Card body */}
      <div className="p-3 cursor-pointer" onClick={() => navigate(learnPath)}>
        <h3 className="text-sm font-semibold text-text-base leading-snug line-clamp-2 mb-1">
          {course.title}
        </h3>
        <p className="text-xs text-text-muted truncate mb-2">{course.instructor.name}</p>

        {/* Progress bar */}
        <div className="h-1 bg-gray-200 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${course.completionPercent}%` }}
          />
        </div>

        {/* Status row */}
        <div className="flex items-center justify-between">
          {course.completionPercent === 0 ? (
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">
              Start course
            </span>
          ) : course.completionPercent === 100 ? (
            <span className="text-xs text-primary font-medium">100% complete</span>
          ) : (
            <span className="text-xs text-text-muted">{course.completionPercent}% complete</span>
          )}

          {course.completionPercent === 100 && course.userRating ? (
            <div className="flex items-center gap-1">
              <StarRating rating={course.userRating} size={11} />
              <span className="text-[10px] text-text-muted">Your rating</span>
            </div>
          ) : course.completionPercent === 100 && !course.userRating ? (
            <span className="flex items-center gap-0.5 text-[10px] text-text-muted hover:text-accent transition-colors cursor-pointer">
              Leave a rating
              {[1,2,3,4,5].map(i => (
                <Star key={i} size={10} className="text-gray-300" />
              ))}
            </span>
          ) : course.completionPercent >= 20 ? (
            <span className="text-[10px] text-text-muted hover:text-accent transition-colors cursor-pointer">
              Leave a rating
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ───── List Item ───── */
function EnrolledCourseListItem({ course }: { course: EnrolledCourse }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const learnPath = `/learn/${course.slug}${course.lastLectureId ? `/${course.lastLectureId}` : ''}`;

  return (
    <div
      className="flex items-center gap-4 p-3 hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={() => navigate(learnPath)}
    >
      {/* Thumbnail */}
      <div className="w-20 h-14 rounded-lg overflow-hidden flex-shrink-0">
        {course.thumbnailPublicId ? (
          <img src={cloudinaryImageUrl(course.thumbnailPublicId, 160, 112)} className="w-full h-full object-cover" alt="" />
        ) : (
          <div className="w-full h-full bg-primary/10 flex items-center justify-center">
            <Sprout size={16} className="text-primary/30" />
          </div>
        )}
      </div>

      {/* Title + instructor */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-text-base leading-snug line-clamp-1">{course.title}</h3>
        <p className="text-xs text-text-muted mt-0.5">{course.instructor.name}</p>
      </div>

      {/* Progress */}
      <div className="w-40 flex-shrink-0">
        <div className="h-1 bg-gray-200 rounded-full overflow-hidden mb-1">
          <div className="h-full bg-primary rounded-full" style={{ width: `${course.completionPercent}%` }} />
        </div>
        <span className="text-[11px] text-text-muted">
          {course.completionPercent === 0 ? 'Not started' : `${course.completionPercent}%`}
        </span>
      </div>

      {/* Rating */}
      <div className="w-32 flex-shrink-0 text-right">
        {course.userRating
          ? <StarRating rating={course.userRating} size={11} />
          : <span className="text-xs text-text-muted">Leave a rating</span>}
      </div>

      {/* Menu */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={e => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
          className="p-1.5 text-text-muted hover:text-text-base flex-shrink-0"
        >
          <MoreHorizontal size={15} />
        </button>
        {menuOpen && (
          <div className="absolute top-8 right-0 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-52 z-20">
            <MenuOption icon={<Play size={14} />} label="Continue course" onClick={() => navigate(learnPath)} />
            <MenuOption icon={<ExternalLink size={14} />} label="Course details" onClick={() => navigate(`/course/${course.slug}`)} />
            <MenuOption icon={<Archive size={14} />} label="Archive" onClick={() => toast.info('Course archived')} />
            <MenuOption icon={<Share2 size={14} />} label="Share" onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/course/${course.slug}`);
              toast.success('Link copied!');
            }} />
          </div>
        )}
      </div>
    </div>
  );
}

function MenuOption({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick(); }}
      className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-base hover:bg-gray-50 cursor-pointer w-full text-left"
    >
      {icon}
      {label}
    </button>
  );
}
