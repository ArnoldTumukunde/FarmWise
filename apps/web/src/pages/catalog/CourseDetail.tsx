import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchApi } from "@/lib/api";
import { cloudinaryImageUrl, cloudinaryVideoUrl } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import {
  Star,
  Users,
  PlayCircle,
  FileText,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  BookOpen,
  Award,
  ShoppingCart,
  Loader2,
  User,
  CheckCircle2,
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
  instructor: { profile: { displayName: string; headline: string; bio: string } };
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

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const sizeClass = size === "lg" ? "h-5 w-5" : "h-4 w-4";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${sizeClass} ${
            i <= Math.round(rating)
              ? "fill-[#F57F17] text-[#F57F17]"
              : "fill-gray-300 text-gray-300"
          }`}
        />
      ))}
    </div>
  );
}

function LectureIcon({ type }: { type: string }) {
  switch (type) {
    case "VIDEO":
      return <PlayCircle className="h-4 w-4 text-[#5A6E5A]" />;
    case "ARTICLE":
      return <FileText className="h-4 w-4 text-[#5A6E5A]" />;
    default:
      return <HelpCircle className="h-4 w-4 text-[#5A6E5A]" />;
  }
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function formatPrice(price: string): string {
  const num = Number(price);
  if (num === 0) return "Free";
  return `UGX ${num.toLocaleString()}`;
}

// Preview media component — shows thumbnail with play button, switches to video on click
function PreviewMedia({ course }: { course: CourseDetailData }) {
  const [playing, setPlaying] = useState(false);

  // Find the first preview lecture with a video
  const previewLecture = course.sections
    .flatMap(s => s.lectures)
    .find(l => l.isPreview && l.type === 'VIDEO');

  // Use course-level previewVideoPublicId or fall back to first preview lecture
  const hasPreview = !!course.previewVideoPublicId || !!previewLecture;

  if (playing && hasPreview) {
    // If course has a previewVideoPublicId, use it directly as mp4
    // Otherwise, use the signed URL approach for the preview lecture
    if (course.previewVideoPublicId) {
      return (
        <div className="aspect-video bg-black">
          <video
            src={cloudinaryVideoUrl(course.previewVideoPublicId) + '.mp4'}
            className="w-full h-full"
            controls
            autoPlay
            playsInline
          />
        </div>
      );
    } else if (previewLecture) {
      // Use HlsPlayer for preview lectures
      return (
        <div className="aspect-video bg-black">
          <PreviewLecturePlayer lectureId={previewLecture.id} />
        </div>
      );
    }
  }

  return (
    <div
      className="aspect-video bg-gray-100 relative cursor-pointer group"
      onClick={() => hasPreview && setPlaying(true)}
    >
      {course.thumbnailPublicId ? (
        <img
          src={cloudinaryImageUrl(course.thumbnailPublicId, 600)}
          alt={course.title}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-[#5A6E5A] bg-gradient-to-br from-[#2E7D32]/10 to-[#4CAF50]/5">
          No Image
        </div>
      )}
      {hasPreview && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
          <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <PlayCircle className="w-8 h-8 text-[#2E7D32] ml-0.5" />
          </div>
          <span className="absolute bottom-3 left-3 text-white text-xs font-medium bg-black/50 px-2 py-1 rounded">
            Preview this course
          </span>
        </div>
      )}
    </div>
  );
}

// Simple preview lecture player using signed URL
function PreviewLecturePlayer({ lectureId }: { lectureId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchApi(`/courses/lectures/${lectureId}/preview-url`, { method: 'POST' })
      .then(({ url }) => setSrc(url))
      .catch((e) => setError(e.message || 'Could not load preview'));
  }, [lectureId]);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white text-sm">
        {error}
      </div>
    );
  }

  if (!src) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      src={src}
      className="w-full h-full"
      controls
      autoPlay
      playsInline
    />
  );
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
  const [course, setCourse] = useState<CourseDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviews, setReviews] = useState<any[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    fetchApi(`/courses/${slug}`)
      .then((res) => {
        setCourse(res.course);
        // Expand first section by default
        if (res.course.sections.length > 0) {
          setExpandedSections(new Set([res.course.sections[0].id]));
        }
        return fetchApi(`/reviews/courses/${res.course.id}`).catch(() => ({ reviews: [] }));
      })
      .then((res) => {
        if (res?.reviews) setReviews(res.reviews);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleEnroll = async () => {
    if (!token) {
      navigate("/login");
      return;
    }
    if (!course) return;

    const isFree = Number(course.price) === 0;

    if (isFree) {
      // Enroll directly for free courses
      setEnrolling(true);
      try {
        const res = await fetchApi('/payments/checkout', {
          method: 'POST',
          body: JSON.stringify({ courseId: course.id }),
        });
        if (res.enrolled) {
          toast.success("Enrolled successfully!");
          navigate(`/learn/${res.courseSlug || course.slug}`);
        }
      } catch (err: any) {
        toast.error(err.message || "Could not enroll");
      } finally {
        setEnrolling(false);
      }
      return;
    }

    // Paid courses: add to cart
    const saved = localStorage.getItem("farmwise-cart");
    const cart = saved ? JSON.parse(saved) : [];
    if (cart.some((item: any) => item.id === course.id)) {
      toast.info("This course is already in your cart");
      navigate("/cart");
      return;
    }
    cart.push({
      id: course.id,
      title: course.title,
      price: course.price,
      thumbnailUrl: course.thumbnailPublicId ? cloudinaryImageUrl(course.thumbnailPublicId, 400) : null,
      instructorName: course.instructor.profile.displayName,
    });
    localStorage.setItem("farmwise-cart", JSON.stringify(cart));
    toast.success("Added to cart!");
    navigate("/cart");
  };

  if (loading) return <Skeleton />;
  if (error || !course) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <p className="text-red-500 font-medium">{error || "Course not found"}</p>
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

  const totalLectures = course.sections.reduce((acc, s) => acc + s.lectures.length, 0);
  const totalDuration = course.sections.reduce(
    (acc, s) => acc + s.lectures.reduce((a, l) => a + (l.duration || 0), 0),
    0
  );
  const isFree = Number(course.price) === 0;

  return (
    <div>
      {/* Dark hero section */}
      <section className="bg-[#1A2E1A] text-white py-10 md:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-4">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">
                {course.title}
              </h1>
              <p className="text-lg text-white/70">{course.subtitle}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                <div className="flex items-center gap-1.5">
                  <span className="text-[#F57F17] font-semibold">
                    {Number(course.averageRating).toFixed(1)}
                  </span>
                  <StarRating rating={course.averageRating} />
                  <span className="text-white/50">
                    ({course._count.reviews.toLocaleString()} reviews)
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-white/60">
                  <Users className="h-4 w-4" />
                  {course._count.enrollments.toLocaleString()} students
                </div>
              </div>
              <p className="text-sm text-white/60">
                Created by{" "}
                <span className="text-[#4CAF50] font-medium">
                  {course.instructor.profile.displayName}
                </span>
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="px-3 py-1 bg-white/10 rounded-full text-xs text-white/80">{course.level}</span>
                <span className="px-3 py-1 bg-white/10 rounded-full text-xs text-white/80">{course.language}</span>
                {course.category && (
                  <span className="px-3 py-1 bg-white/10 rounded-full text-xs text-white/80">{course.category.name}</span>
                )}
                {course.isFeatured && (
                  <span className="px-3 py-1 bg-[#F57F17]/20 rounded-full text-xs text-[#F57F17] font-semibold">{"\u2605"} Featured</span>
                )}
                <span className="text-xs text-white/50">Last updated {new Date(course.updatedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
              </div>
            </div>

            {/* Desktop sidebar card */}
            <div className="hidden lg:block">
              <Card className="bg-white text-[#1B2B1B] overflow-hidden shadow-2xl border-0 sticky top-20">
                <PreviewMedia course={course} />
                <CardContent className="p-6 space-y-5">
                  <div className={`text-3xl font-bold ${isFree ? "text-[#2E7D32]" : "text-[#1B2B1B]"}`}>
                    {formatPrice(course.price)}
                  </div>
                  <Button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="w-full h-12 text-base bg-[#2E7D32] hover:bg-[#256829] text-white font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                  >
                    {enrolling ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : isFree ? (
                      "Enroll Now"
                    ) : (
                      <span className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5" />
                        Add to Cart
                      </span>
                    )}
                  </Button>
                  <p className="text-xs text-center text-[#5A6E5A]">30-Day Money-Back Guarantee</p>
                  <div className="border-t border-gray-100 pt-4 space-y-3 text-sm text-[#5A6E5A]">
                    <p className="font-semibold text-[#1B2B1B]">This course includes:</p>
                    <div className="flex items-center gap-2">
                      <PlayCircle className="h-4 w-4 text-[#2E7D32]" />
                      {totalLectures} lectures
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-[#2E7D32]" />
                      {Math.ceil(totalDuration / 60)} min total
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-[#2E7D32]" />
                      {course.sections.length} sections
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-[#2E7D32]" />
                      Certificate of completion
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-10">
            {/* What you'll learn */}
            {course.outcomes?.length > 0 && (
              <section className="bg-white p-6 rounded-xl border-2 border-[#2E7D32]/20 space-y-4">
                <h2 className="text-xl font-bold text-[#1B2B1B]">What you'll learn</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {course.outcomes.map((outcome, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-[#2E7D32] shrink-0 mt-0.5" />
                      <span className="text-sm text-[#1B2B1B]/80">{outcome}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Description */}
            <section className="bg-white p-6 rounded-xl border border-gray-200 space-y-4">
              <h2 className="text-xl font-bold text-[#1B2B1B]">About this course</h2>
              <div className="prose max-w-none text-[#1B2B1B]/80 whitespace-pre-line text-sm leading-relaxed">
                {course.description || ''}
              </div>
            </section>

            {/* Requirements */}
            {course.requirements?.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-bold text-[#1B2B1B]">Requirements</h2>
                <ul className="space-y-2">
                  {course.requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-[#1B2B1B]/80">
                      <span className="text-[#5A6E5A] mt-1">&bull;</span>
                      {req}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Curriculum */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-[#1B2B1B]">Curriculum</h2>
              <p className="text-sm text-[#5A6E5A]">
                {course.sections.length} sections &middot; {totalLectures} lectures &middot;{" "}
                {Math.ceil(totalDuration / 60)} min total
              </p>
              <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-200">
                {course.sections.map((section) => {
                  const isExpanded = expandedSections.has(section.id);
                  return (
                    <div key={section.id}>
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-[#FAFAF5] transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                      >
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-[#5A6E5A]" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-[#5A6E5A]" />
                          )}
                          <span className="font-semibold text-[#1B2B1B] text-sm">
                            {section.title}
                          </span>
                        </div>
                        <span className="text-xs text-[#5A6E5A] whitespace-nowrap ml-4">
                          {section.lectures.length} lectures
                        </span>
                      </button>
                      {isExpanded && (
                        <div className="divide-y divide-gray-100 bg-[#FAFAF5]">
                          {section.lectures.map((lecture) => (
                            <div
                              key={lecture.id}
                              className="flex items-center justify-between px-5 py-3 text-sm"
                            >
                              <div className="flex items-center gap-3">
                                <LectureIcon type={lecture.type} />
                                <span
                                  className={
                                    lecture.isPreview
                                      ? "text-[#2E7D32] font-medium"
                                      : "text-[#1B2B1B]"
                                  }
                                >
                                  {lecture.title}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                                {lecture.isPreview && (
                                  <span className="text-xs bg-[#2E7D32]/10 text-[#2E7D32] px-2 py-0.5 rounded-md font-medium">
                                    Preview
                                  </span>
                                )}
                                {lecture.duration && (
                                  <span className="text-xs text-[#5A6E5A]">
                                    {formatDuration(lecture.duration)}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Instructor */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-[#1B2B1B]">Instructor</h2>
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <div className="flex gap-4 items-start">
                  <div className="w-16 h-16 rounded-full bg-[#2E7D32]/10 flex items-center justify-center flex-shrink-0">
                    <User className="h-7 w-7 text-[#2E7D32]" />
                  </div>
                  <div className="space-y-2">
                    <div className="font-bold text-lg text-[#2E7D32]">
                      {course.instructor.profile.displayName}
                    </div>
                    <div className="text-sm text-[#5A6E5A]">
                      {course.instructor?.profile?.headline || ''}
                    </div>
                    <p className="text-sm text-[#1B2B1B]/80 leading-relaxed mt-2">
                      {course.instructor?.profile?.bio || ''}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Topics / Tags */}
            {course.tags?.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xl font-bold text-[#1B2B1B]">Topics</h2>
                <div className="flex flex-wrap gap-2">
                  {course.tags.map((t, i) => (
                    <span key={i} className="px-3 py-1.5 bg-[#2E7D32]/10 text-[#2E7D32] text-sm rounded-full font-medium">
                      {t.tag.name}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Reviews */}
            <section className="space-y-6">
              <h2 className="text-xl font-bold text-[#1B2B1B]">Student Reviews</h2>

              {/* Rating summary */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 flex items-center gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-[#1B2B1B]">
                    {Number(course.averageRating).toFixed(1)}
                  </div>
                  <StarRating rating={course.averageRating} size="lg" />
                  <div className="text-xs text-[#5A6E5A] mt-1">Course Rating</div>
                </div>
              </div>

              {/* Individual reviews */}
              <div className="space-y-4">
                {reviews.length > 0 ? (
                  reviews.map((review) => (
                    <div
                      key={review.id}
                      className="bg-white rounded-xl border border-gray-200 p-5 space-y-3"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#2E7D32]/10 flex items-center justify-center">
                            <span className="font-bold text-sm text-[#2E7D32]">
                              {review.user?.profile?.displayName?.[0] || "U"}
                            </span>
                          </div>
                          <div>
                            <div className="font-semibold text-sm text-[#1B2B1B]">
                              {review.user?.profile?.displayName || "Student"}
                            </div>
                            <div className="text-xs text-[#5A6E5A]">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <StarRating rating={review.rating} />
                      </div>
                      {review.content && (
                        <p className="text-sm text-[#1B2B1B]/80 leading-relaxed">
                          {review.content}
                        </p>
                      )}
                      {review.instructorResponse && (
                        <div className="mt-3 bg-[#FAFAF5] p-4 rounded-lg border border-gray-100">
                          <div className="text-xs font-bold text-[#2E7D32] mb-1">
                            Instructor Response
                          </div>
                          <p className="text-sm text-[#1B2B1B]/70">
                            {review.instructorResponse}
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-[#5A6E5A]">
                    No reviews yet. Be the first to review!
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Spacer for sidebar alignment on desktop */}
          <div className="hidden lg:block" />
        </div>
      </div>

      {/* Mobile sticky bottom bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-40 flex items-center justify-between gap-4 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
        <div>
          <div className={`text-xl font-bold ${isFree ? "text-[#2E7D32]" : "text-[#1B2B1B]"}`}>
            {formatPrice(course.price)}
          </div>
        </div>
        <Button
          onClick={handleEnroll}
          disabled={enrolling}
          className="h-11 px-8 bg-[#2E7D32] hover:bg-[#256829] text-white font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
        >
          {enrolling ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : isFree ? (
            "Enroll Now"
          ) : (
            <span className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Add to Cart
            </span>
          )}
        </Button>
      </div>

      {/* Bottom padding to account for mobile sticky bar */}
      <div className="lg:hidden h-20" />
    </div>
  );
}
