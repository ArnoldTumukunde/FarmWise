import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Download, Check, Star } from 'lucide-react';
import { cloudinaryImageUrl, formatUGX } from '@/lib/utils';
import { fetchApi } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';

/* ── Types ─────────────────────────────────────────────── */

export interface CourseCardData {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  thumbnailPublicId: string | null;
  instructor: { id?: string; name?: string; profile?: { displayName: string } };
  category?: { slug?: string; name: string };
  averageRating: number;
  reviewCount: number;
  price: number;
  originalPrice?: number;
  totalDuration?: number;
  level?: string;
  language?: string;
  updatedAt?: string;
  isFeatured?: boolean;
  isBestseller?: boolean;
  isOfflineEnabled?: boolean;
  outcomes?: string[];
  _count?: { enrollments?: number; reviews?: number };
}

interface CourseCardProps {
  course: CourseCardData;
  eager?: boolean; // above-the-fold cards
}

/* ── Star Rating ───────────────────────────────────────── */

export function StarRating({ rating, size = 11 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-px">
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = rating >= i ? 1 : rating >= i - 0.5 ? 0.5 : 0;
        return (
          <Star
            key={i}
            size={size}
            className="text-accent"
            fill={fill > 0 ? '#F57F17' : 'none'}
            strokeWidth={fill === 0.5 ? 1.5 : fill === 1 ? 0 : 1.5}
          />
        );
      })}
    </div>
  );
}

/* ── Badge Components ──────────────────────────────────── */

export function BestsellerBadge() {
  return (
    <span className="bg-accent text-white text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wide shadow-sm">
      Bestseller
    </span>
  );
}

export function FeaturedBadge() {
  return (
    <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wide shadow-sm">
      Featured
    </span>
  );
}

export function OfflineBadge() {
  return (
    <span className="bg-black/60 text-white text-[10px] font-medium px-2 py-0.5 rounded-sm flex items-center gap-1 backdrop-blur-sm">
      <Download size={9} />
      Offline
    </span>
  );
}

/* ── Helpers ───────────────────────────────────────────── */

function getInstructorName(instructor: CourseCardData['instructor']): string {
  return instructor.name || instructor.profile?.displayName || 'Instructor';
}

function getReviewCount(course: CourseCardData): number {
  return course.reviewCount || course._count?.reviews || 0;
}

function getRating(course: CourseCardData): number {
  return Number(course.averageRating) || 0;
}

function getPrice(course: CourseCardData): number {
  return Number(course.price) || 0;
}

function isBestseller(course: CourseCardData): boolean {
  if (course.isBestseller) return true;
  const enrollments = course._count?.enrollments || 0;
  return enrollments > 500 && getRating(course) >= 4.5;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

const LEVEL_LABELS: Record<string, string> = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
  ALL_LEVELS: 'All Levels',
};

/* ── CourseCard Component ──────────────────────────────── */

export default function CourseCard({ course, eager = false }: CourseCardProps) {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const cardRef = useRef<HTMLDivElement>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupSide, setPopupSide] = useState<'right' | 'left'>('right');
  const [isWishlisted, setIsWishlisted] = useState(false);

  const rating = getRating(course);
  const reviewCount = getReviewCount(course);
  const price = getPrice(course);
  const bestseller = isBestseller(course);
  const instructorName = getInstructorName(course.instructor);

  const handleMouseEnter = useCallback(() => {
    if (window.matchMedia('(hover: none)').matches) return;
    hoverTimerRef.current = setTimeout(() => {
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        setPopupSide(rect.right + 292 > window.innerWidth ? 'left' : 'right');
      }
      setShowPopup(true);
    }, 300);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => setShowPopup(false), 100);
  }, []);

  const cancelHide = useCallback(() => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
  }, []);

  const toggleWishlist = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) {
      navigate('/login?redirect=/courses');
      return;
    }
    const prev = isWishlisted;
    setIsWishlisted(!prev);
    try {
      await fetchApi(`/enrollments/wishlist/${course.id}`, {
        method: prev ? 'DELETE' : 'POST',
      });
    } catch {
      setIsWishlisted(prev);
      toast.error('Failed to update wishlist');
    }
  }, [course.id, isWishlisted, token, navigate]);

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (price === 0) {
      // Enroll free
      if (!token) {
        navigate('/login?redirect=/courses/' + course.slug);
        return;
      }
      fetchApi(`/enrollments/enroll/${course.id}`, { method: 'POST' })
        .then(() => {
          toast.success('Enrolled successfully!');
          navigate(`/learn/${course.id}`);
        })
        .catch((err: any) => toast.error(err.message || 'Enrollment failed'));
    } else {
      // Add to cart
      if (!token) {
        navigate('/login?redirect=/courses/' + course.slug);
        return;
      }
      fetchApi('/cart', {
        method: 'POST',
        body: JSON.stringify({ courseId: course.id }),
      })
        .then(() => toast.success('Added to cart'))
        .catch((err: any) => toast.error(err.message || 'Failed to add to cart'));
    }
  }, [course.id, course.slug, price, token, navigate]);

  return (
    <div
      ref={cardRef}
      className="relative bg-white rounded-lg overflow-visible cursor-pointer group transition-shadow duration-150 hover:shadow-lg hover:z-10"
      role="article"
      aria-label={course.title}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => navigate(`/course/${course.slug}`)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden rounded-t-lg">
        {course.thumbnailPublicId ? (
          <img
            src={cloudinaryImageUrl(course.thumbnailPublicId, 480, 270)}
            alt={course.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading={eager ? 'eager' : 'lazy'}
            {...(eager ? { fetchPriority: 'high' } as any : {})}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary-light/10 flex items-center justify-center text-text-muted text-sm">
            {course.category?.name || 'Course'}
          </div>
        )}

        {/* Wishlist heart */}
        <button
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10 hover:bg-white hover:scale-110 active:scale-95"
          onClick={toggleWishlist}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={isWishlisted}
        >
          <Heart
            size={15}
            className={isWishlisted ? 'text-red-500' : 'text-text-base'}
            fill={isWishlisted ? '#ef4444' : 'none'}
          />
        </button>

        {/* Badge overlay row */}
        <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between">
          <div className="flex gap-1.5 flex-wrap">
            {bestseller && <BestsellerBadge />}
            {course.isFeatured && !bestseller && <FeaturedBadge />}
          </div>
          {course.isOfflineEnabled && <OfflineBadge />}
        </div>
      </div>

      {/* Card body */}
      <div className="p-3">
        <h3 className="text-sm font-semibold text-text-base leading-snug line-clamp-2 mb-1">
          {course.title}
        </h3>
        <p className="text-xs text-text-muted mb-1.5 truncate">{instructorName}</p>

        {/* Rating row */}
        <div className="flex items-center gap-1.5 mb-1.5">
          {rating > 0 ? (
            <>
              <span className="text-xs font-bold text-accent">{rating.toFixed(1)}</span>
              <StarRating rating={rating} size={11} />
              <span className="text-xs text-text-muted">({reviewCount.toLocaleString()})</span>
            </>
          ) : (
            <span className="text-xs text-text-muted">New</span>
          )}
        </div>

        {/* Price row */}
        <div className="flex items-center gap-2">
          {price === 0 ? (
            <span className="text-sm font-bold text-primary">Free</span>
          ) : (
            <>
              <span className="text-sm font-bold text-text-base">{formatUGX(price)}</span>
              {course.originalPrice && course.originalPrice > price && (
                <span className="text-xs text-text-muted line-through">
                  {formatUGX(course.originalPrice)}
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* ─── Hover Popup ─── */}
      {showPopup && (
        <div
          className={`absolute top-0 z-50 w-[280px] bg-white rounded-lg shadow-2xl border border-gray-100 pointer-events-auto animate-in ${
            popupSide === 'right' ? 'left-[calc(100%+12px)]' : 'right-[calc(100%+12px)]'
          }`}
          role="tooltip"
          onMouseEnter={cancelHide}
          onMouseLeave={handleMouseLeave}
        >
          <div className="p-4">
            <h3 className="text-sm font-bold text-text-base leading-snug mb-2">
              {course.title}
            </h3>

            {/* Badges */}
            <div className="flex items-center gap-1.5 mb-2 flex-wrap">
              {bestseller && <BestsellerBadge />}
              {course.isFeatured && <FeaturedBadge />}
              {course.isOfflineEnabled && <OfflineBadge />}
              {price === 0 && (
                <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase">
                  Free
                </span>
              )}
            </div>

            {/* Updated date */}
            {course.updatedAt && (
              <p className="text-xs text-text-muted mb-2">
                Updated <span className="font-semibold text-primary">{formatDate(course.updatedAt)}</span>
              </p>
            )}

            {/* Meta row */}
            <p className="text-xs text-text-muted mb-3">
              {course.totalDuration ? formatDuration(course.totalDuration) + ' total' : ''}
              {course.level ? ` · ${LEVEL_LABELS[course.level] || course.level}` : ''}
              {course.language ? ` · ${course.language}` : ''}
            </p>

            {/* Subtitle */}
            {course.subtitle && (
              <p className="text-xs text-text-base leading-relaxed line-clamp-2 mb-3">
                {course.subtitle}
              </p>
            )}

            {/* Learning outcomes */}
            {course.outcomes && course.outcomes.length > 0 && (
              <ul className="space-y-1.5 mb-4">
                {course.outcomes.slice(0, 3).map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-text-base leading-relaxed">
                    <Check size={12} className="text-primary flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* CTA row */}
            <div className="flex items-center gap-2">
              <button
                className="flex-1 bg-primary hover:bg-primary-light text-white text-sm font-semibold py-2.5 rounded transition-colors duration-150 active:scale-[0.98]"
                onClick={handleAddToCart}
              >
                {price === 0 ? 'Enroll Free' : 'Add to Cart'}
              </button>
              <button
                className={`w-10 h-10 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors duration-150 ${
                  isWishlisted
                    ? 'border-red-400 bg-red-50'
                    : 'border-gray-300 hover:border-primary'
                }`}
                onClick={toggleWishlist}
                aria-label="Add to wishlist"
              >
                <Heart
                  size={16}
                  className={isWishlisted ? 'text-red-500' : 'text-text-muted'}
                  fill={isWishlisted ? '#ef4444' : 'none'}
                />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
