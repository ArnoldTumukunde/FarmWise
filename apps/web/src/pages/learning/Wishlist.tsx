import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '../../lib/api';
import { cloudinaryImageUrl, formatUGX } from '../../lib/utils';
import { Heart, ShoppingCart, Star, Sprout, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface WishlistCourse {
  id: string;
  slug: string;
  title: string;
  price: string;
  thumbnailPublicId: string | null;
  averageRating?: number;
  instructor: { profile: { displayName: string } };
  _count?: { enrollments: number; reviews: number };
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i <= Math.round(rating)
              ? 'fill-[#F57F17] text-[#F57F17]'
              : 'fill-gray-200 text-gray-200'
          }`}
        />
      ))}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-[#2E7D32]/10 overflow-hidden animate-pulse">
      <div className="aspect-video bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-100 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="flex gap-2 pt-2">
          <div className="h-10 bg-gray-200 rounded-lg flex-1" />
          <div className="h-10 w-10 bg-gray-200 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function Wishlist() {
  const [courses, setCourses] = useState<WishlistCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    fetchApi('/wishlist')
      .then((res) => setCourses(res.wishlist || res.courses || []))
      .catch((err) => {
        console.error(err);
        // Fallback endpoint
        fetchApi('/enrollments/wishlist')
          .then((res) => setCourses(res.wishlist || res.courses || []))
          .catch(console.error);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = async (courseId: string) => {
    setRemovingId(courseId);
    try {
      await fetchApi(`/wishlist/${courseId}`, { method: 'DELETE' });
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
      toast.success('Removed from wishlist');
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove from wishlist');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF5]">
      {/* Header */}
      <div className="bg-[#2E7D32] pt-10 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <Heart size={28} className="text-white/80" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">My Wishlist</h1>
              {!loading && courses.length > 0 && (
                <p className="text-white/70 text-sm mt-1">
                  {courses.length} saved course{courses.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-10 relative z-10 pb-20">
        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Courses Grid */}
        {!loading && courses.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-xl border border-[#2E7D32]/10 overflow-hidden hover:shadow-md transition-shadow"
              >
                <Link to={`/course/${course.slug}`}>
                  {course.thumbnailPublicId ? (
                    <img
                      src={cloudinaryImageUrl(course.thumbnailPublicId, 400, 225)}
                      alt={course.title}
                      className="w-full aspect-video object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full aspect-video bg-gradient-to-br from-[#2E7D32]/20 to-[#4CAF50]/10 flex items-center justify-center">
                      <Sprout size={40} className="text-[#2E7D32]/30" />
                    </div>
                  )}
                </Link>
                <div className="p-4">
                  <Link to={`/course/${course.slug}`}>
                    <h3 className="font-bold text-[#1B2B1B] line-clamp-2 leading-snug text-sm hover:text-[#2E7D32] transition-colors">
                      {course.title}
                    </h3>
                  </Link>
                  <p className="text-xs text-[#5A6E5A] mt-1">
                    {course.instructor?.profile?.displayName}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {course.averageRating ? (
                      <>
                        <span className="text-sm font-medium text-[#1B2B1B]">
                          {Number(course.averageRating).toFixed(1)}
                        </span>
                        <StarRating rating={course.averageRating} />
                      </>
                    ) : (
                      <span className="text-xs text-[#5A6E5A]">New course</span>
                    )}
                  </div>
                  <p className="text-base font-bold text-[#1B2B1B] mt-2">
                    {formatUGX(course.price)}
                  </p>

                  <div className="flex gap-2 mt-3">
                    <Link
                      to={`/course/${course.slug}`}
                      className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-[#2E7D32] text-white font-medium rounded-lg hover:bg-[#2E7D32]/90 transition-colors text-sm focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                    >
                      <ShoppingCart size={14} />
                      Enroll Now
                    </Link>
                    <button
                      onClick={() => handleRemove(course.id)}
                      disabled={removingId === course.id}
                      className="p-2.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50"
                      title="Remove from Wishlist"
                    >
                      {removingId === course.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Heart size={16} className="fill-red-500" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && courses.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-[#2E7D32]/10 max-w-lg mx-auto">
            <div className="w-20 h-20 mx-auto bg-red-50 rounded-full flex items-center justify-center mb-6">
              <Heart size={40} className="text-red-300" />
            </div>
            <h2 className="text-xl font-bold text-[#1B2B1B] mb-2">No saved courses yet</h2>
            <p className="text-[#5A6E5A] mb-6 max-w-sm mx-auto text-sm px-4">
              Browse our catalog to find courses you love.
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
