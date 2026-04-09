import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import CourseCard, { type CourseCardData } from './CourseCard';
import { CourseCardSkeleton } from './CourseCardSkeleton';

interface RelatedCoursesSectionProps {
  courseSlug: string;
  categoryName?: string;
}

export function RelatedCoursesSection({ courseSlug, categoryName }: RelatedCoursesSectionProps) {
  const [courses, setCourses] = useState<CourseCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi(`/courses/${courseSlug}/related`)
      .then((res) => {
        const mapped = (res.courses || []).map((c: any): CourseCardData => ({
          id: c.id,
          slug: c.slug,
          title: c.title,
          subtitle: c.subtitle || '',
          thumbnailPublicId: c.thumbnailPublicId,
          instructor: { name: c.instructor?.profile?.displayName || 'Instructor' },
          category: c.category,
          averageRating: Number(c.averageRating) || 0,
          reviewCount: c.reviewCount || c._count?.reviews || 0,
          price: Number(c.price) || 0,
          totalDuration: c.totalDuration || 0,
          level: c.level,
          language: c.language,
          updatedAt: c.updatedAt,
          isFeatured: c.isFeatured,
          isOfflineEnabled: c.isOfflineEnabled,
          outcomes: c.outcomes || [],
          _count: c._count,
        }));
        setCourses(mapped);
      })
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, [courseSlug]);

  if (!loading && courses.length === 0) return null;

  return (
    <section className="py-10 border-t border-gray-100">
      <h2 className="text-xl lg:text-2xl font-bold text-text-base mb-2">
        {categoryName ? `More courses in ${categoryName}` : 'Related courses'}
      </h2>
      <p className="text-sm text-text-muted mb-6">
        Students who enrolled in this course also viewed
      </p>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CourseCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-hide -mx-1 px-1">
          {courses.map((course) => (
            <div key={course.id} className="w-[260px] flex-shrink-0">
              <CourseCard course={course} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
