import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import CourseCard, { type CourseCardData } from './CourseCard';
import { CourseCardSkeleton } from './CourseCardSkeleton';

interface CourseStripProps {
  title?: React.ReactNode;
  subtitle?: string;
  courses: CourseCardData[];
  isLoading?: boolean;
  viewAllHref?: string;
}

function ScrollArrow({
  direction,
  stripRef,
}: {
  direction: 'left' | 'right';
  stripRef: React.RefObject<HTMLDivElement | null>;
}) {
  const scroll = () => {
    if (!stripRef.current) return;
    stripRef.current.scrollBy({
      left: direction === 'right' ? 500 : -500,
      behavior: 'smooth',
    });
  };

  return (
    <button
      onClick={scroll}
      className={`absolute top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white shadow-lg border border-gray-200 items-center justify-center hidden md:flex hover:bg-gray-50 transition-colors ${
        direction === 'left' ? 'left-1' : 'right-1'
      }`}
      aria-label={`Scroll ${direction}`}
    >
      {direction === 'left' ? (
        <ChevronLeft size={18} className="text-text-base" />
      ) : (
        <ChevronRight size={18} className="text-text-base" />
      )}
    </button>
  );
}

export default function CourseStrip({ title, subtitle, courses, isLoading, viewAllHref }: CourseStripProps) {
  const stripRef = useRef<HTMLDivElement>(null);

  return (
    <section>
      {/* Header */}
      {title && (
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-text-base">{title}</h2>
            {subtitle && <p className="text-sm text-text-muted mt-0.5">{subtitle}</p>}
          </div>
          {viewAllHref && (
            <a
              href={viewAllHref}
              className="text-sm font-semibold text-primary hover:underline underline-offset-2 whitespace-nowrap ml-4"
            >
              View all &rarr;
            </a>
          )}
        </div>
      )}

      {/* Scrollable row — breaks out of parent padding for edge-to-edge scroll */}
      <div className="relative -mx-4 md:-mx-6 lg:-mx-10">
        <div
          ref={stripRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide px-4 md:px-6 lg:px-10 pb-2"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[240px]" style={{ scrollSnapAlign: 'start' }}>
                  <CourseCardSkeleton />
                </div>
              ))
            : courses.map((course) => (
                <div key={course.id} className="flex-shrink-0 w-[240px]" style={{ scrollSnapAlign: 'start' }}>
                  <CourseCard course={course} />
                </div>
              ))}
        </div>

        {!isLoading && courses.length > 4 && (
          <>
            <ScrollArrow direction="left" stripRef={stripRef} />
            <ScrollArrow direction="right" stripRef={stripRef} />
          </>
        )}
      </div>
    </section>
  );
}
