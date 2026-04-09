import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '@/lib/api';
import { cloudinaryImageUrl } from '@/lib/utils';
import { Sprout, Star } from 'lucide-react';

interface FeaturedCourse {
  id: string;
  slug: string;
  title: string;
  thumbnailPublicId: string | null;
  totalDuration?: number;
}

interface Collection {
  title: string;
  description: string;
  iconName: string;
  avgRating: number;
  totalRatings: number;
  totalHours: number;
  courseCount: number;
  courses: FeaturedCourse[];
}

export function FeaturedCollectionBlock() {
  const [collection, setCollection] = useState<Collection | null>(null);

  useEffect(() => {
    fetchApi('/courses/collections/featured')
      .then(data => { if (data?.title && data?.courses?.length > 0) setCollection(data); })
      .catch(() => {});
  }, []);

  if (!collection || collection.courses.length === 0) return null;

  return (
    <div className="px-4 md:px-6 lg:px-10 py-6 border-t border-gray-100">
      <div className="bg-surface-dark rounded-2xl overflow-hidden flex flex-col md:flex-row">
        {/* Left Panel */}
        <div className={`flex-shrink-0 p-6 ${collection.courses.length <= 1 ? 'w-full md:w-1/2' : 'w-full md:w-64'}`}>
          <Sprout size={32} className="text-accent" />
          <h2 className="text-xl font-bold text-white mt-3">{collection.title}</h2>
          <p className="text-sm text-green-200 mt-2 leading-relaxed">{collection.description}</p>
          <div className="flex items-center gap-1 flex-wrap text-xs text-green-300 mt-3">
            <Star size={12} fill="currentColor" />
            <span>{collection.avgRating}</span>
            <span>({collection.totalRatings} ratings)</span>
            <span className="mx-1">&middot;</span>
            <span>{collection.totalHours} total hours</span>
            <span className="mx-1">&middot;</span>
            <span>{collection.courseCount} courses</span>
          </div>
          <Link
            to="/courses"
            className="mt-5 inline-block border border-white/50 text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            Learn more
          </Link>
        </div>

        {/* Right Panel — course cards on same dark green bg */}
        <div className={`flex-1 flex gap-3 p-4 overflow-x-auto scrollbar-hide items-start ${
          collection.courses.length <= 1 ? 'justify-center' : ''
        }`}>
          {collection.courses.map((course, i) => {
            const durationMin = course.totalDuration ? Math.round(course.totalDuration / 60) : null;
            return (
              <Link
                key={course.id}
                to={`/course/${course.slug}`}
                className="w-[200px] flex-shrink-0 bg-white rounded-xl p-3 hover:shadow-md transition-shadow"
              >
                <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 mb-2">
                  {course.thumbnailPublicId ? (
                    <img
                      src={cloudinaryImageUrl(course.thumbnailPublicId, 400, 225)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Sprout size={20} className="text-primary/30" />
                    </div>
                  )}
                </div>
                <h3 className="text-xs font-semibold text-text-base line-clamp-2 leading-snug">
                  {course.title}
                </h3>
                <p className="text-[11px] text-text-muted mt-1">
                  Course {i + 1} of {collection.courseCount}
                </p>
                {durationMin != null && (
                  <p className="text-[11px] text-text-muted">{durationMin}m</p>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
