import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '@/lib/api';
import CourseStrip from '@/components/course/CourseStrip';

export function BecauseYouEnrolledStrip() {
  const [courses, setCourses] = useState<any[]>([]);
  const [refCourse, setRefCourse] = useState<{ title: string; slug: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi('/enrollments')
      .then(async (res) => {
        const enrollments = res.enrollments || [];
        if (enrollments.length === 0) { setLoading(false); return; }
        const recent = enrollments[0];
        setRefCourse({ title: recent.course.title, slug: recent.course.slug });

        const recRes = await fetchApi(`/farmer/because-you-enrolled?courseId=${recent.courseId}&limit=8`);
        const mapped = (recRes.courses || []).map((c: any) => ({
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

  if (!loading && (courses.length === 0 || !refCourse)) return null;

  return (
    <div className="px-4 md:px-6 lg:px-10 py-6 border-t border-gray-100">
      <CourseStrip
        title={
          refCourse ? (
            <span>
              Because you enrolled in &quot;
              <Link to={`/course/${refCourse.slug}`} className="text-primary underline-offset-2 hover:underline">
                {refCourse.title}
              </Link>
              &quot;
            </span>
          ) : 'Recommended for you'
        }
        courses={courses}
        isLoading={loading}
      />
    </div>
  );
}
