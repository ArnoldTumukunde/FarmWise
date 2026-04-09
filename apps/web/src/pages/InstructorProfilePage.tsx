import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Users, BookOpen, MessageSquare, ArrowLeft } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { cloudinaryImageUrl, formatUGX } from '@/lib/utils';
import CourseStrip from '@/components/course/CourseStrip';
import type { CourseCardData } from '@/components/course/CourseCard';

/* ── Types ── */

interface InstructorProfile {
  id: string;
  name: string;
  title: string;
  avatarUrl: string | null;
  bio: string;
  courseCount: number;
  totalStudents: number;
  averageRating: number;
  totalReviews: number;
  courses: CourseCardData[];
  featuredReviews: FeaturedReview[];
}

interface FeaturedReview {
  id: string;
  content: string;
  rating: number;
  createdAt: string;
  authorName: string;
  courseTitle: string;
}

/* ── Helpers ── */

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

const GRADIENTS = [
  'bg-gradient-to-br from-[#1b4332] to-[#2d6a4f]',
  'bg-gradient-to-br from-[#7b3f00] to-[#a0522d]',
  'bg-gradient-to-br from-[#2c4a1e] to-[#4a7c59]',
  'bg-gradient-to-br from-[#1a3a1a] to-[#2E7D32]',
];

function getGradient(id: string): string {
  const idx = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % GRADIENTS.length;
  return GRADIENTS[idx];
}

/* ── Skeleton ── */

function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-[#FAFAF5] animate-pulse">
      <div className="bg-[#1A2E1A] px-4 md:px-10 py-12">
        <div className="max-w-5xl mx-auto flex items-start gap-8">
          <div className="w-24 h-24 rounded-full bg-white/10" />
          <div className="flex-1 space-y-3">
            <div className="h-8 bg-white/10 rounded w-1/3" />
            <div className="h-5 bg-white/10 rounded w-1/2" />
            <div className="h-4 bg-white/10 rounded w-2/3" />
          </div>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  );
}

/* ── Main Page ── */

export default function InstructorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [instructor, setInstructor] = useState<InstructorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bioExpanded, setBioExpanded] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchApi(`/profile/${id}`)
      .then((data: any) => {
        setInstructor({
          id: data.id || id,
          name: data.name || data.profile?.displayName || 'Instructor',
          title: data.title || data.profile?.headline || 'Agricultural Expert',
          avatarUrl: data.avatarUrl || (data.profile?.avatarPublicId
            ? cloudinaryImageUrl(data.profile.avatarPublicId, 192, 192)
            : null),
          bio: data.bio || data.profile?.bio || '',
          courseCount: data.courseCount ?? data.courses?.length ?? 0,
          totalStudents: data.totalStudents ?? 0,
          averageRating: data.averageRating ?? 0,
          totalReviews: data.totalReviews ?? 0,
          courses: (data.courses ?? []).map((c: any) => ({
            id: c.id,
            slug: c.slug,
            title: c.title,
            thumbnailPublicId: c.thumbnailPublicId || null,
            instructor: { name: data.name || data.profile?.displayName, profile: { displayName: data.name || data.profile?.displayName } },
            category: c.category,
            averageRating: Number(c.averageRating) || 0,
            reviewCount: c.reviewCount || c._count?.reviews || 0,
            price: Number(c.price) || 0,
            totalDuration: c.totalDuration,
            level: c.level,
            isFeatured: c.isFeatured,
            isOfflineEnabled: c.isOfflineEnabled,
            _count: c._count,
          })),
          featuredReviews: data.featuredReviews ?? [],
        });
      })
      .catch((e: any) => setError(e.message || 'Failed to load profile'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <ProfileSkeleton />;

  if (error || !instructor) {
    return (
      <div className="min-h-screen bg-[#FAFAF5] flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-[#1B2B1B] font-semibold mb-2">
            {error || 'Instructor not found'}
          </p>
          <Link to="/courses" className="text-[#2E7D32] hover:underline text-sm">
            &larr; Back to courses
          </Link>
        </div>
      </div>
    );
  }

  const bioIsLong = instructor.bio.length > 400;

  return (
    <div className="min-h-screen bg-[#FAFAF5]">
      {/* 1. Instructor Hero */}
      <div className="bg-[#1A2E1A] px-4 md:px-10 py-12">
        <div className="max-w-5xl mx-auto">
          <Link to="/courses" className="inline-flex items-center gap-1 text-green-200/70 hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft size={14} /> Back to courses
          </Link>

          <div className="flex items-start gap-6 md:gap-8">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full overflow-hidden flex-shrink-0">
              {instructor.avatarUrl ? (
                <img src={instructor.avatarUrl} alt={instructor.name} className="w-full h-full object-cover" />
              ) : (
                <div className={`w-full h-full flex items-center justify-center ${getGradient(instructor.id)}`}>
                  <span className="text-white font-bold text-2xl">{getInitials(instructor.name)}</span>
                </div>
              )}
            </div>

            <div>
              <h1 className="text-3xl font-bold text-white">{instructor.name}</h1>
              <p className="text-base text-green-200 mt-1">{instructor.title}</p>

              {/* Stats row */}
              <div className="flex items-center gap-6 mt-4 flex-wrap">
                {[
                  {
                    icon: <Star size={14} fill="#F57F17" stroke="#F57F17" />,
                    value: instructor.averageRating > 0 ? `${instructor.averageRating.toFixed(1)}` : '—',
                    label: 'Instructor rating',
                  },
                  {
                    icon: <Users size={14} className="text-green-300" />,
                    value: instructor.totalStudents.toLocaleString(),
                    label: 'Students',
                  },
                  {
                    icon: <BookOpen size={14} className="text-green-300" />,
                    value: String(instructor.courseCount),
                    label: 'Courses',
                  },
                  {
                    icon: <MessageSquare size={14} className="text-green-300" />,
                    value: instructor.totalReviews.toLocaleString(),
                    label: 'Reviews',
                  },
                ].map((stat, i) => (
                  <div key={stat.label} className="flex items-center gap-1.5 text-sm text-green-100">
                    {stat.icon}
                    <strong className="text-white">{stat.value}</strong>
                    <span className="text-green-200">{stat.label}</span>
                    {i < 3 && <span className="text-green-300/40 ml-3">&middot;</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. About */}
      {instructor.bio && (
        <div className="max-w-5xl mx-auto px-4 md:px-10 py-10">
          <h2 className="text-xl font-bold text-[#1B2B1B] mb-4">About</h2>
          <div className="relative">
            <div
              className={`prose prose-sm max-w-none text-[#1B2B1B] ${
                !bioExpanded && bioIsLong ? 'max-h-32 overflow-hidden' : ''
              }`}
              dangerouslySetInnerHTML={{ __html: instructor.bio }}
            />
            {!bioExpanded && bioIsLong && (
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#FAFAF5] to-transparent pointer-events-none" />
            )}
            {bioIsLong && (
              <button
                onClick={() => setBioExpanded(p => !p)}
                className="mt-2 text-[#2E7D32] text-sm font-semibold hover:underline underline-offset-2"
              >
                {bioExpanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. Courses */}
      {instructor.courses.length > 0 && (
        <div className="max-w-5xl mx-auto px-4 md:px-10 py-6">
          <CourseStrip
            title={`Courses by ${instructor.name.split(' ')[0]}`}
            courses={instructor.courses}
          />
        </div>
      )}

      {/* 4. Featured Reviews */}
      {instructor.featuredReviews.length > 0 && (
        <div className="max-w-5xl mx-auto px-4 md:px-10 py-10">
          <h2 className="text-xl font-bold text-[#1B2B1B] mb-6">
            What farmers say about {instructor.name.split(' ')[0]}'s courses
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {instructor.featuredReviews.slice(0, 3).map(review => (
              <div key={review.id} className="bg-white rounded-xl border border-gray-200 p-5">
                {/* Stars */}
                <div className="flex gap-0.5 mb-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star
                      key={i}
                      size={13}
                      fill={i <= review.rating ? '#F57F17' : 'none'}
                      stroke="#F57F17"
                    />
                  ))}
                </div>

                {/* Review body */}
                <p className="text-sm text-[#1B2B1B] italic leading-relaxed line-clamp-4">
                  &ldquo;{review.content}&rdquo;
                </p>

                {/* Author */}
                <div className="mt-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#2E7D32]/15 flex items-center justify-center
                                  text-[#2E7D32] text-xs font-bold flex-shrink-0">
                    {review.authorName?.[0] || '?'}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#1B2B1B]">{review.authorName}</p>
                    <p className="text-[11px] text-[#5A6E5A]">on &ldquo;{review.courseTitle}&rdquo;</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
