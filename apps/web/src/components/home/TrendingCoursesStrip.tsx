import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import CourseStrip from '@/components/course/CourseStrip';

export function TrendingCoursesStrip() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi('/courses/trending?limit=8')
      .then(res => {
        const mapped = (res.courses || []).map((c: any) => ({
          id: c.id, slug: c.slug, title: c.title, subtitle: c.subtitle,
          thumbnailPublicId: c.thumbnailPublicId, price: Number(c.price),
          averageRating: Number(c.averageRating), reviewCount: c._count?.reviews || 0,
          level: c.level, language: c.language, updatedAt: c.updatedAt,
          totalDuration: c.totalDuration, isFeatured: c.isFeatured,
          instructor: { name: c.instructor?.profile?.displayName || 'Instructor' },
          _count: c._count,
        }));
        setCourses(mapped);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!loading && courses.length === 0) return null;

  return (
    <div className="px-4 md:px-6 lg:px-10 py-6 border-t border-gray-100">
      <CourseStrip
        title="Trending courses"
        courses={courses}
        isLoading={loading}
      />
    </div>
  );
}
