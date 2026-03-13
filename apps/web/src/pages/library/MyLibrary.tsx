import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '../../lib/api';
import { cloudinaryImageUrl } from '../../lib/utils';
import { PlayCircle, BookOpen, Sprout } from 'lucide-react';
import { OfflineBanner } from '../../components/OfflineBanner';

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col animate-pulse">
      <div className="w-full aspect-video bg-gray-200" />
      <div className="p-4 flex-1 flex flex-col gap-3">
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-100 rounded w-1/2" />
        <div className="mt-auto pt-4 space-y-2">
          <div className="h-2 bg-gray-200 rounded-full w-full" />
          <div className="h-10 bg-gray-200 rounded-lg w-full" />
        </div>
      </div>
    </div>
  );
}

export function MyLibrary() {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi('/enrollments')
      .then(res => setEnrollments(res.enrollments))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAF5] pb-20 font-[Inter]">
      <OfflineBanner />

      {/* Header */}
      <div className="bg-[#2E7D32] pt-10 pb-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <BookOpen size={28} className="text-white/80" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">My Learning</h1>
              {!loading && enrollments.length > 0 && (
                <p className="text-white/70 text-sm mt-1">
                  {enrollments.length} course{enrollments.length !== 1 ? 's' : ''} enrolled
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-14 relative z-10">
        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Course Cards */}
        {!loading && enrollments.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollments.map((enr: any) => {
              const progressPercent = enr.progressPercent ?? 0;

              return (
                <div
                  key={enr.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col group hover:shadow-md transition-shadow"
                >
                  {/* Thumbnail */}
                  {enr.course.thumbnailPublicId ? (
                    <img
                      src={cloudinaryImageUrl(enr.course.thumbnailPublicId, 400, 225)}
                      alt={enr.course.title}
                      className="w-full aspect-video object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-video bg-gradient-to-br from-[#2E7D32]/20 to-[#4CAF50]/10 flex items-center justify-center">
                      <Sprout size={40} className="text-[#2E7D32]/30" />
                    </div>
                  )}

                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="font-bold text-base text-[#1B2B1B] line-clamp-2 leading-snug">
                      {enr.course.title}
                    </h3>
                    <p className="text-sm text-[#5A6E5A] mt-1">
                      {enr.course.instructor?.profile?.displayName}
                    </p>

                    <div className="mt-auto pt-4 space-y-3">
                      {/* Progress bar */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-medium text-[#5A6E5A]">
                            {progressPercent}% complete
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#4CAF50] rounded-full transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Resume button */}
                      <Link
                        to={`/learn/${enr.course.id}`}
                        className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#2E7D32]/10 text-[#2E7D32] font-medium rounded-lg group-hover:bg-[#2E7D32] group-hover:text-white transition-colors text-sm focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                      >
                        <PlayCircle size={18} />
                        {progressPercent > 0 ? 'Resume' : 'Start Learning'}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && enrollments.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white rounded-xl shadow-sm border border-gray-100 max-w-lg mx-auto">
            <div className="mx-auto mb-6">
              <div className="w-20 h-20 mx-auto bg-[#2E7D32]/10 rounded-full flex items-center justify-center">
                <Sprout size={40} className="text-[#2E7D32]" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-[#1B2B1B] mb-2">
              No courses yet
            </h2>
            <p className="text-[#5A6E5A] mb-6 max-w-sm mx-auto text-sm px-4">
              You haven't enrolled in any courses yet. Start with a free one and grow your farming knowledge!
            </p>
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#2E7D32] text-white font-medium rounded-lg hover:bg-[#2E7D32]/90 transition-colors focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
            >
              Browse Courses
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
