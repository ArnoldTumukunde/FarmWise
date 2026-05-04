import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchApi } from "@/lib/api";
import { cloudinaryImageUrl, cloudinaryVideoUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/ui/StarRating";
import { CoursePreviewModal } from "@/components/course/CoursePreviewModal";
import { StickyBuyBar } from "@/components/course/StickyBuyBar";
import { WhatYouWillLearnSection } from "@/components/course/WhatYouWillLearnSection";
import { CourseContentSection } from "@/components/course/CourseContentSection";
import { RequirementsSection } from "@/components/course/RequirementsSection";
import { DescriptionSection } from "@/components/course/DescriptionSection";
import { InstructorSection } from "@/components/course/InstructorSection";
import { ReviewsSection } from "@/components/course/ReviewsSection";
import { RelatedCoursesSection } from "@/components/course/RelatedCoursesSection";
import { ShareButtons } from "@/components/course/ShareButtons";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { toast } from "sonner";
import {
  Users,
  PlayCircle,
  Clock,
  BookOpen,
  Award,
  ShoppingCart,
  Loader2,
  Play,
  CalendarDays,
  Globe,
  ShieldCheck,
  Download,
  Smartphone,
  FileText,
} from "lucide-react";

interface CourseDetailData {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  price: string;
  thumbnailPublicId: string | null;
  previewVideoPublicId: string | null;
  instructor: {
    id?: string;
    profile: {
      displayName: string;
      headline: string;
      bio: string;
      avatarPublicId?: string;
    };
  };
  sections: {
    id: string;
    title: string;
    order: number;
    lectures: {
      id: string;
      title: string;
      order: number;
      type: string;
      duration: number | null;
      isPreview: boolean;
    }[];
  }[];
  _count: { enrollments: number; reviews: number };
  averageRating: number;
  outcomes: string[];
  requirements: string[];
  level: string;
  language: string;
  category: { id: string; name: string; slug: string; iconName: string | null };
  tags: { tag: { name: string } }[];
  isFeatured: boolean;
  updatedAt: string;
  totalDuration: number;
}

function formatPrice(price: string): string {
  const num = Number(price);
  if (num === 0) return "Free";
  return `UGX ${num.toLocaleString()}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function Skeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-[#1A2E1A] py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="max-w-3xl space-y-4">
            <div className="h-8 bg-white/10 rounded w-3/4" />
            <div className="h-5 bg-white/10 rounded w-1/2" />
            <div className="h-4 bg-white/10 rounded w-2/5" />
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="h-6 bg-gray-200 rounded w-1/3" />
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
          <div className="h-4 bg-gray-200 rounded w-4/6" />
        </div>
      </div>
    </div>
  );
}

export default function CourseDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const cart = useCartStore();
  const [course, setCourse] = useState<CourseDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviews, setReviews] = useState<any[]>([]);
  const [enrolling, setEnrolling] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [thumbnailCollapsed, setThumbnailCollapsed] = useState(false);

  // Ref for StickyBuyBar IntersectionObserver — placed on a non-sticky wrapper
  const purchaseCardRef = useRef<HTMLDivElement>(null);
  // Ref for hero section — when it leaves viewport, collapse the card thumbnail
  const heroRef = useRef<HTMLElement>(null);

  // Observe the hero section: collapse thumbnail when hero scrolls out
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const observer = new IntersectionObserver(
      ([entry]) => setThumbnailCollapsed(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, [course]); // re-attach when course loads

  useEffect(() => {
    fetchApi(`/courses/${slug}`)
      .then((res) => {
        setCourse(res.course);
        return fetchApi(`/reviews/courses/${res.course.id}`).catch(() => ({
          reviews: [],
        }));
      })
      .then((res) => {
        if (res?.reviews) setReviews(res.reviews);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleEnroll = async () => {
    if (!token) {
      navigate("/login");
      return;
    }
    if (!course) return;

    const isFree = Number(course.price) === 0;

    if (isFree) {
      setEnrolling(true);
      try {
        const res = await fetchApi("/payments/checkout", {
          method: "POST",
          body: JSON.stringify({ courseIds: [course.id] }),
        });
        if (res.enrolled || res.freeCheckout) {
          toast.success("Enrolled successfully!");
          const slug = res.courseSlugs?.[0] || course.slug;
          navigate(`/learn/${slug}`);
        }
      } catch (err: any) {
        toast.error(err.message || "Could not enroll");
      } finally {
        setEnrolling(false);
      }
      return;
    }

    // Paid courses: add to cart via API
    try {
      await fetchApi('/cart', {
        method: 'POST',
        body: JSON.stringify({ courseId: course.id }),
      });
      await cart.fetchCart();
      toast.success('Added to cart!');
    } catch (err: any) {
      if (err.message?.includes('already')) {
        toast.info('This course is already in your cart');
      } else {
        toast.error(err.message || 'Failed to add to cart');
        return;
      }
    }
  };

  if (loading) return <Skeleton />;
  if (error || !course) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <p className="text-red-500 font-medium">
            {error || "Course not found"}
          </p>
          <Button
            variant="outline"
            onClick={() => navigate("/courses")}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
          >
            Browse courses
          </Button>
        </div>
      </div>
    );
  }

  const totalLectures = course.sections.reduce(
    (acc, s) => acc + s.lectures.length,
    0
  );
  const totalDuration = course.sections.reduce(
    (acc, s) => acc + s.lectures.reduce((a, l) => a + (l.duration || 0), 0),
    0
  );
  const isFree = Number(course.price) === 0;
  const thumbnailUrl = course.thumbnailPublicId
    ? cloudinaryImageUrl(course.thumbnailPublicId, 600)
    : null;
  // Don't use raw Cloudinary URLs — let the modal fetch signed URLs via the API
  const previewVideoUrl = "";

  // Build preview lectures list for modal
  const previewLectures = course.sections
    .flatMap((s) => s.lectures)
    .filter((l) => l.isPreview && l.type === "VIDEO")
    .map((l) => ({
      id: l.id,
      title: l.title,
      durationSeconds: l.duration || 0,
      isPreview: true,
      videoUrl: undefined as string | undefined,
    }));

  const purchaseCardProps = {
    course,
    isFree,
    thumbnailUrl,
    totalLectures,
    totalDuration,
    enrolling,
    onEnroll: handleEnroll,
    onPreviewOpen: () => setIsPreviewOpen(true),
    thumbnailCollapsed: false,
  };

  return (
    <div>
      {/* Sticky Buy Bar — appears when purchase card scrolls out of view */}
      <StickyBuyBar
        courseTitle={course.title}
        price={Number(course.price)}
        averageRating={Number(course.averageRating)}
        reviewCount={course._count.reviews}
        onAddToCart={handleEnroll}
        purchaseCardRef={purchaseCardRef}
      />

      {/* Course Preview Modal */}
      <CoursePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        courseTitle={course.title}
        previewVideoUrl={previewVideoUrl}
        previewLectures={previewLectures}
      />

      {/* ─── HERO SECTION ─── dark full-width background */}
      <section ref={heroRef} className="bg-surface-dark text-white py-10 md:py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:flex lg:gap-12 lg:items-start">
          {/* Left column — course info */}
          <div className="flex-1 min-w-0">
            {/* Breadcrumb */}
            <nav aria-label="breadcrumb">
              <ol className="flex items-center flex-wrap gap-0 text-sm mb-5">
                <li>
                  <a
                    href="/courses"
                    className="text-green-300 hover:text-white transition-colors duration-150 hover:underline underline-offset-2"
                  >
                    Catalog
                  </a>
                </li>
                <li>
                  <span aria-hidden="true" className="mx-2 text-white/40">
                    &rsaquo;
                  </span>
                </li>
                {course.category && (
                  <>
                    <li>
                      <a
                        href={`/courses?category=${course.category.slug}`}
                        className="text-green-300 hover:text-white transition-colors duration-150 hover:underline underline-offset-2"
                      >
                        {course.category.name}
                      </a>
                    </li>
                    <li>
                      <span
                        aria-hidden="true"
                        className="mx-2 text-white/40"
                      >
                        &rsaquo;
                      </span>
                    </li>
                  </>
                )}
                <li className="text-white/60 truncate max-w-[200px]">
                  {course.title.slice(0, 40)}
                  {course.title.length > 40 ? "\u2026" : ""}
                </li>
              </ol>
            </nav>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight tracking-tight mb-4">
              {course.title}
            </h1>

            {/* Subtitle */}
            {course.subtitle && (
              <p className="text-lg text-white/70 mb-4">{course.subtitle}</p>
            )}

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {course.isFeatured && (
                <span className="px-3 py-1 bg-[#F57F17]/20 rounded-full text-xs text-[#F57F17] font-semibold">
                  {"\u2605"} Featured
                </span>
              )}
              <span className="px-3 py-1 bg-white/10 rounded-full text-xs text-white/80">
                {course.level}
              </span>
            </div>

            {/* Rating row */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-accent font-bold text-lg leading-none">
                {Number(course.averageRating).toFixed(1)}
              </span>
              <StarRating rating={Number(course.averageRating)} />
              <span className="text-white/55 text-sm">
                ({course._count.reviews.toLocaleString()} reviews)
              </span>
            </div>

            {/* Instructor line — linked */}
            <p className="text-sm text-white/60 mb-5">
              Created by{" "}
              <a
                href={`/instructors/${course.instructor.id}`}
                className="text-green-300 underline underline-offset-2 hover:text-white transition-colors duration-150"
              >
                {course.instructor.profile.displayName}
              </a>
            </p>

            {/* Metadata row */}
            <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-white/65 mb-5">
              <span className="flex items-center gap-1.5">
                <CalendarDays size={13} className="opacity-60" />
                Last updated {formatDate(course.updatedAt)}
              </span>
              <span className="text-white/30">&middot;</span>
              <span className="flex items-center gap-1.5">
                <Globe size={13} className="opacity-60" />
                {course.language ?? "English"}
              </span>
              <span className="text-white/30">&middot;</span>
              <span className="flex items-center gap-1.5">
                <Users size={13} className="opacity-60" />
                {course._count.enrollments.toLocaleString()} students enrolled
              </span>
            </div>
          </div>

          {/* Right column spacer — reserves space in hero so left text doesn't span full width */}
          <div className="hidden lg:block w-[380px] flex-shrink-0" />
        </div>
      </section>

      {/* ─── MOBILE PURCHASE CARD (between hero and sections) ─── */}
      <div className="lg:hidden" ref={purchaseCardRef}>
        <div className="max-w-xl mx-auto px-4 -mt-6 mb-6">
          <PurchaseCard {...purchaseCardProps} />
        </div>
      </div>

      {/* ─── BELOW-HERO: Left sections + Right sticky purchase card ─── */}
      {/* No items-start here — right column must stretch to left column height for sticky to work */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:flex lg:gap-12">
        {/* Left column — all content sections */}
        <div className="flex-1 min-w-0">
          <WhatYouWillLearnSection outcomes={course.outcomes} />

          <CourseContentSection
            sections={course.sections}
            totalDuration={totalDuration}
          />

          <RequirementsSection requirements={course.requirements} />

          <DescriptionSection description={course.description || ""} />

          <InstructorSection
            instructor={{
              id: course.instructor.id,
              name: course.instructor.profile.displayName,
              title: course.instructor.profile.headline || undefined,
              bio: course.instructor.profile.bio || undefined,
              avatarUrl: course.instructor.profile.avatarPublicId
                ? cloudinaryImageUrl(
                    course.instructor.profile.avatarPublicId,
                    200
                  )
                : undefined,
            }}
          />

          {/* Topics / Tags */}
          {course.tags?.length > 0 && (
            <section className="py-10 border-b border-gray-100">
              <h2 className="text-xl lg:text-2xl font-bold text-text-base mb-5">
                Topics
              </h2>
              <div className="flex flex-wrap gap-2">
                {course.tags.map((t, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 bg-primary/10 text-primary text-sm rounded-full font-medium"
                  >
                    {t.tag.name}
                  </span>
                ))}
              </div>
            </section>
          )}

          <ReviewsSection
            reviews={reviews}
            averageRating={Number(course.averageRating)}
            reviewCount={course._count.reviews}
          />

          {/* Share buttons */}
          <section className="py-6 border-t border-gray-100">
            <ShareButtons title={course.title} />
          </section>

          {/* Related courses */}
          <RelatedCoursesSection
            courseSlug={course.slug}
            categoryName={course.category?.name}
          />
        </div>

        {/* Right column — sticky purchase card (desktop only) */}
        {/* Uses negative margin to pull up and visually overlap the hero */}
        <div className="hidden lg:block w-[380px] flex-shrink-0">
          <div className="sticky top-24 -mt-72">
            <div ref={purchaseCardRef}>
              <PurchaseCard {...purchaseCardProps} thumbnailCollapsed={thumbnailCollapsed} />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom padding */}
      <div className="h-8" />
    </div>
  );
}

/* ─── Purchase Card Component ─── */
interface PurchaseCardProps {
  course: CourseDetailData;
  isFree: boolean;
  thumbnailUrl: string | null;
  totalLectures: number;
  totalDuration: number;
  enrolling: boolean;
  onEnroll: () => void;
  onPreviewOpen: () => void;
  thumbnailCollapsed: boolean;
}

function PurchaseCard({
  course,
  isFree,
  thumbnailUrl,
  totalLectures,
  totalDuration,
  enrolling,
  onEnroll,
  onPreviewOpen,
  thumbnailCollapsed,
}: PurchaseCardProps) {
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMsg, setCouponMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [discountedPrice, setDiscountedPrice] = useState<number | null>(null);

  const price = Number(course.price);
  const displayPrice = discountedPrice !== null ? discountedPrice : price;
  const hours = Math.floor(totalDuration / 3600);
  const mins = Math.floor((totalDuration % 3600) / 60);
  const durationText = hours > 0 ? `${hours}h ${mins > 0 ? `${mins}m` : ''}` : `${mins}m`;

  const applyCoupon = async () => {
    if (!couponCode) return;
    setCouponLoading(true);
    setCouponMsg(null);
    try {
      const res = await fetchApi('/cart/coupon', {
        method: 'POST',
        body: JSON.stringify({ code: couponCode, courseId: course.id, cartSubtotal: price }),
      });
      const saved = price - (res.discountAmount || 0);
      setDiscountedPrice(Math.max(0, saved));
      setCouponMsg({ type: 'success', text: `Coupon applied! You save ${formatPrice(String(res.discountAmount))}` });
    } catch (err: any) {
      const msg = err.message || 'Invalid coupon';
      setCouponMsg({ type: 'error', text: msg.includes('expired') ? 'This coupon has expired' : msg.includes('used') ? "You've already used this coupon" : 'Coupon not found' });
    } finally {
      setCouponLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-xl transition-shadow duration-200 hover:shadow-2xl border border-gray-200">
      {/* Thumbnail */}
      <div
        className={`relative overflow-hidden cursor-pointer group transition-all duration-500 ease-in-out
                    ${thumbnailCollapsed ? 'max-h-0 opacity-0' : 'max-h-60 opacity-100'}`}
        onClick={onPreviewOpen}
        role="button"
        tabIndex={thumbnailCollapsed ? -1 : 0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onPreviewOpen(); }}
        aria-label="Preview this course"
        aria-hidden={thumbnailCollapsed}
      >
        <div className="aspect-video">
          {thumbnailUrl ? (
            <img src={thumbnailUrl} alt={`${course.title} preview`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
          ) : (
            <div className="w-full h-full bg-surface-dark flex items-center justify-center">
              <span className="text-white/30 text-4xl font-bold">{course.title.charAt(0)}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors duration-300" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg transition-transform duration-200 group-hover:scale-110">
              <Play size={22} className="ml-1" style={{ color: '#1A2E1A' }} fill="#1A2E1A" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-sm text-center py-2 font-medium">
            Preview this course
          </div>
        </div>
      </div>

      {/* Card body */}
      <div className="p-6 space-y-4">
        {/* Price row */}
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-bold ${isFree ? 'text-primary' : 'text-text-base'}`}>
            {displayPrice === 0 ? 'Free' : formatPrice(String(displayPrice))}
          </span>
          {discountedPrice !== null && discountedPrice < price && (
            <>
              <span className="text-lg text-text-muted line-through">{formatPrice(course.price)}</span>
              <span className="text-sm font-semibold text-primary">
                {Math.round(((price - discountedPrice) / price) * 100)}% off
              </span>
            </>
          )}
        </div>

        {/* Coupon input (paid courses only) */}
        {!isFree && (
          <div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                onClick={applyCoupon}
                disabled={!couponCode || couponLoading}
                className="px-4 py-2 border border-primary text-primary text-sm font-semibold rounded-lg hover:bg-primary hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {couponLoading ? '...' : 'Apply'}
              </button>
            </div>
            {couponMsg && (
              <p className={`text-sm mt-1.5 ${couponMsg.type === 'success' ? 'text-primary' : 'text-red-500'}`}>
                {couponMsg.type === 'success' && '✓ '}{couponMsg.text}
              </p>
            )}
          </div>
        )}

        {/* Primary CTA */}
        <Button
          onClick={onEnroll}
          disabled={enrolling}
          className="w-full h-12 text-base bg-primary hover:bg-primary-light text-white font-semibold transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {enrolling ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : isFree ? (
            'Enroll for Free'
          ) : (
            <span className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Add to Cart
            </span>
          )}
        </Button>

        {/* Buy Now (paid, not in cart) */}
        {!isFree && (
          <button
            onClick={() => navigate(`/checkout?courseId=${course.id}`)}
            className="w-full py-3 border-2 border-gray-300 text-text-base hover:border-primary rounded-lg font-semibold text-sm transition-colors"
          >
            Buy Now
          </button>
        )}

        {/* Guarantee */}
        <div className="flex items-center justify-center gap-2 text-xs text-text-muted">
          <ShieldCheck size={13} className="text-primary flex-shrink-0" />
          <span>30-Day Money-Back Guarantee</span>
        </div>

        {/* Course includes */}
        <div className="border-t border-gray-100 pt-4 space-y-2">
          <p className="font-semibold text-sm text-text-base mb-2">This course includes:</p>
          {totalDuration > 0 && (
            <div className="flex items-center gap-2.5 text-sm text-text-muted py-1">
              <Clock size={15} className="flex-shrink-0" /> {durationText} on-demand video
            </div>
          )}
          <div className="flex items-center gap-2.5 text-sm text-text-muted py-1">
            <BookOpen size={15} className="flex-shrink-0" /> {course.sections.length} sections · {totalLectures} lectures
          </div>
          <div className="flex items-center gap-2.5 text-sm text-text-muted py-1">
            <Smartphone size={15} className="flex-shrink-0" /> Access on mobile, tablet and desktop
          </div>
          <div className="flex items-center gap-2.5 text-sm text-text-muted py-1">
            <Download size={15} className="flex-shrink-0" /> Download lectures for offline viewing
          </div>
          <div className="flex items-center gap-2.5 text-sm text-text-muted py-1">
            <Award size={15} className="flex-shrink-0" /> Certificate of completion
          </div>
        </div>

        {/* Share (compact) */}
        <div className="border-t border-gray-100 pt-3">
          <ShareButtons compact />
        </div>
      </div>
    </div>
  );
}
