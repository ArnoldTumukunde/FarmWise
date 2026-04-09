import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '@/lib/api';
import { cloudinaryImageUrl, formatUGX } from '@/lib/utils';
import { StarRating } from '@/components/ui/StarRating';
import { Heart, ShoppingCart, Sprout, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface WishlistCourse {
  id: string;
  slug: string;
  title: string;
  price: string;
  thumbnailPublicId: string | null;
  averageRating?: number;
  instructor: { profile?: { displayName: string } };
  _count?: { enrollments: number; reviews: number };
}

export function WishlistTab() {
  const [courses, setCourses] = useState<WishlistCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    fetchApi('/wishlist')
      .then(res => setCourses(res.wishlist || res.courses || []))
      .catch(() => {
        fetchApi('/enrollments/wishlist')
          .then(res => setCourses(res.wishlist || res.courses || []))
          .catch(() => {});
      })
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = async (courseId: string) => {
    setRemovingId(courseId);
    try {
      await fetchApi(`/wishlist/${courseId}`, { method: 'DELETE' });
      setCourses(prev => prev.filter(c => c.id !== courseId));
      toast.success('Removed from wishlist');
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove');
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) {
    return (
      <div className="px-4 md:px-6 lg:px-10 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="animate-pulse">
              <div className="aspect-video bg-gray-200 rounded-lg" />
              <div className="mt-3 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Heart size={28} className="text-red-300" />
        </div>
        <h3 className="text-lg font-bold text-text-base mb-2">No saved courses yet</h3>
        <p className="text-sm text-text-muted mb-6 max-w-xs mx-auto">
          Browse our catalog and save courses you're interested in.
        </p>
        <Link
          to="/courses"
          className="bg-primary text-white font-semibold px-8 py-3 rounded-lg hover:bg-primary-light transition-colors inline-block"
        >
          Browse courses
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-6 lg:px-10 py-6">
      <p className="text-sm font-medium text-text-base mb-4">
        {courses.length} course{courses.length !== 1 ? 's' : ''} in wishlist
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {courses.map(course => (
          <div key={course.id} className="bg-white rounded-lg border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            <Link to={`/course/${course.slug}`}>
              <div className="aspect-video bg-gray-100 overflow-hidden">
                {course.thumbnailPublicId ? (
                  <img
                    src={cloudinaryImageUrl(course.thumbnailPublicId, 480, 270)}
                    alt={course.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Sprout size={28} className="text-primary/30" />
                  </div>
                )}
              </div>
            </Link>
            <div className="p-3">
              <Link to={`/course/${course.slug}`}>
                <h3 className="text-sm font-semibold text-text-base line-clamp-2 leading-snug hover:text-primary transition-colors">
                  {course.title}
                </h3>
              </Link>
              <p className="text-xs text-text-muted mt-1 truncate">
                {course.instructor?.profile?.displayName || 'Instructor'}
              </p>
              {course.averageRating ? (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-xs font-bold text-text-base">{Number(course.averageRating).toFixed(1)}</span>
                  <StarRating rating={Number(course.averageRating)} size={12} />
                  {course._count?.reviews && (
                    <span className="text-[10px] text-text-muted">({course._count.reviews})</span>
                  )}
                </div>
              ) : null}
              <p className="text-sm font-bold text-text-base mt-1.5">{formatUGX(course.price)}</p>
              <div className="flex gap-2 mt-3">
                <Link
                  to={`/course/${course.slug}`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-light transition-colors text-xs"
                >
                  <ShoppingCart size={13} /> Enroll Now
                </Link>
                <button
                  onClick={() => handleRemove(course.id)}
                  disabled={removingId === course.id}
                  className="p-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {removingId === course.id
                    ? <Loader2 size={14} className="animate-spin" />
                    : <Heart size={14} className="fill-red-500" />}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
