import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '@/lib/api';
import { cloudinaryImageUrl, formatUGX } from '@/lib/utils';
import { StarRating } from '@/components/ui/StarRating';
import { useCartStore } from '@/store/useCartStore';
import { Sprout } from 'lucide-react';
import { toast } from 'sonner';

export function TopPickForYou() {
  const [course, setCourse] = useState<any>(null);
  const cart = useCartStore();

  useEffect(() => {
    fetchApi('/farmer/homepage-recommendations')
      .then(data => {
        // Use top category's best course as the top pick
        if (data?.topCategory?.courses?.[0]) {
          setCourse(data.topCategory.courses[0]);
        }
      })
      .catch(() => {});
  }, []);

  if (!course) return null;

  const totalHours = course.totalDuration ? Math.round(course.totalDuration / 3600) : null;

  return (
    <div className="px-4 md:px-6 lg:px-10 py-6 border-t border-gray-100">
      <h2 className="text-xl font-bold text-text-base mb-4">Our top pick for you</h2>

      <Link
        to={`/course/${course.slug}`}
        className="block bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
      >
        <div className="flex flex-col sm:flex-row">
          {/* Thumbnail */}
          <div className="sm:w-80 sm:h-52 flex-shrink-0">
            {course.thumbnailPublicId ? (
              <img
                src={cloudinaryImageUrl(course.thumbnailPublicId, 640, 416)}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-52 bg-primary/10 flex items-center justify-center">
                <Sprout size={40} className="text-primary/30" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-6">
            <h3 className="text-2xl font-bold text-text-base leading-snug">{course.title}</h3>
            {course.subtitle && (
              <p className="text-sm text-text-muted mt-2 line-clamp-2">{course.subtitle}</p>
            )}
            <p className="text-xs text-text-muted mt-2">
              By {course.instructor?.name || 'Instructor'}
            </p>
            <p className="text-xs text-text-muted mt-1">
              {course.updatedAt && `Updated ${new Date(course.updatedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`}
              {totalHours && ` · ${totalHours} total hours`}
              {course.level && ` · ${course.level}`}
            </p>

            {/* Rating */}
            <div className="flex items-center gap-2 mt-2">
              <StarRating rating={course.averageRating || 0} size={14} showNumber />
              <span className="text-xs text-text-muted">
                ({course.reviewCount || course._count?.reviews || 0})
              </span>
              {course.isFeatured && (
                <span className="text-[10px] font-bold bg-accent/10 text-accent px-2 py-0.5 rounded">
                  Bestseller
                </span>
              )}
            </div>

            {/* Price + CTA */}
            <div className="flex items-center gap-4 mt-3">
              <p className="text-xl font-bold text-text-base">
                {Number(course.price) === 0 ? 'Free' : formatUGX(course.price)}
              </p>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (Number(course.price) === 0) {
                    toast.success('Enrolled!');
                  } else {
                    cart.addItem(course.id);
                    toast.success('Added to cart');
                  }
                }}
                className="bg-primary text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-colors text-sm"
              >
                {Number(course.price) === 0 ? 'Enroll now' : 'Add to cart'}
              </button>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
