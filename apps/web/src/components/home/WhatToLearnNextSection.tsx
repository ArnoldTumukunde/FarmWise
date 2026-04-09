import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '@/lib/api';
import CourseStrip from '@/components/course/CourseStrip';

interface RecommendationData {
  topCategory: {
    name: string;
    slug: string;
    courses: any[];
  } | null;
  becauseYouViewed: {
    courseName: string;
    courseSlug: string;
    courses: any[];
  } | null;
}

export function WhatToLearnNextSection() {
  const [data, setData] = useState<RecommendationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi('/farmer/homepage-recommendations')
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!loading && (!data?.topCategory?.courses?.length && !data?.becauseYouViewed?.courses?.length)) {
    return null;
  }

  return (
    <div className="px-4 md:px-6 lg:px-10 py-6 border-t border-gray-100">
      <h2 className="text-2xl font-bold text-text-base mb-6">What to learn next</h2>

      {data?.topCategory && data.topCategory.courses.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-text-base">
              Top courses in {data.topCategory.name}
            </h3>
            <Link
              to={`/courses?category=${data.topCategory.slug}`}
              className="text-sm font-semibold text-primary hover:underline"
            >
              {data.topCategory.name} →
            </Link>
          </div>
          <CourseStrip
            courses={data.topCategory.courses}
            isLoading={false}
          />
        </div>
      )}

      {data?.becauseYouViewed && data.becauseYouViewed.courses.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-text-base mb-3">
            Because you viewed &quot;{data.becauseYouViewed.courseName}&quot;
          </h3>
          <CourseStrip
            courses={data.becauseYouViewed.courses}
            isLoading={false}
          />
        </div>
      )}

      {loading && (
        <CourseStrip courses={[]} isLoading={true} />
      )}
    </div>
  );
}
