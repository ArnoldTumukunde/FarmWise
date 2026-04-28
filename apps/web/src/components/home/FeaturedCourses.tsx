import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '@/lib/api';
import { cloudinaryImageUrl, formatDuration } from '@/lib/utils';
import { Star, Clock, Download as DownloadIcon } from 'lucide-react';
import { useInView } from '@/hooks/useInView';
import { anim } from '@/lib/animations';

interface Course {
  id: string;
  slug: string;
  title: string;
  thumbnailPublicId?: string | null;
  price: number;
  averageRating: number;
  reviewCount: number;
  totalDuration: number;
  isFeatured: boolean;
  isOfflineEnabled: boolean;
  instructor?: {
    id: string;
    profile?: { displayName: string };
  };
}

interface TabDef {
  key: string;
  label: string;
  query: string;
}

const tabs: TabDef[] = [
  { key: 'featured', label: 'Featured', query: '?featured=true&limit=8' },
  { key: 'crop-farming', label: 'Crop Farming', query: '?categoryId=crop-farming&limit=8' },
  { key: 'livestock', label: 'Livestock', query: '?categoryId=livestock&limit=8' },
  { key: 'soil-health', label: 'Soil Health', query: '?categoryId=soil-health&limit=8' },
  { key: 'pest-control', label: 'Pest Control', query: '?categoryId=pest-control&limit=8' },
  { key: 'free', label: 'Free Courses', query: '?filter=free&limit=8' },
];

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden animate-pulse">
      <div className="aspect-video bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-3 bg-gray-200 rounded w-2/3" />
        <div className="h-4 bg-gray-200 rounded w-1/3" />
      </div>
    </div>
  );
}

export function FeaturedCourses() {
  const [activeTab, setActiveTab] = useState('featured');
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const cache = useRef<Record<string, Course[]>>({});
  const { ref: sectionRef, isInView } = useInView();
  const { ref: tabRef, isInView: tabsVisible } = useInView();

  const fetchTab = useCallback(async (tabKey: string) => {
    if (cache.current[tabKey]) {
      setCourses(cache.current[tabKey]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const tab = tabs.find((t) => t.key === tabKey);
      if (!tab) return;
      const data = await fetchApi(`/courses${tab.query}`);
      const list = Array.isArray(data) ? data : data.data ?? [];
      cache.current[tabKey] = list;
      setCourses(list);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTab(activeTab);
  }, [activeTab, fetchTab]);

  return (
    <section ref={sectionRef} className="max-w-7xl mx-auto px-4 py-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-[#1B2B1B]">
          Explore Inspiring Farm Courses
        </h2>
        <Link
          to="/courses"
          className="hidden sm:inline-flex text-sm font-medium text-[#2E7D32] hover:text-[#4CAF50] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
        >
          View all courses &rarr;
        </Link>
      </div>

      {/* Tabs — field-row animation */}
      <div
        ref={tabRef}
        className="flex gap-1 overflow-x-auto pb-2 mb-8 scrollbar-hide border-b border-gray-200"
        style={anim.fieldRow(tabsVisible)}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`shrink-0 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'border-[#2E7D32] text-[#2E7D32]'
                : 'border-transparent text-[#5A6E5A] hover:text-[#1B2B1B]'
            } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid — soil-rise animation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          : courses.map((course, i) => (
              <Link
                key={course.id}
                to={`/course/${course.slug}`}
                className="group rounded-xl border border-gray-200 overflow-hidden bg-white hover:shadow-lg transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                style={anim.soilRise(isInView, i * 80)}
              >
                {/* Thumbnail */}
                <div className="aspect-video overflow-hidden bg-gradient-to-br from-[#2E7D32]/20 to-[#1A2E1A]/30 relative">
                  {course.thumbnailPublicId ? (
                    <img
                      src={cloudinaryImageUrl(course.thumbnailPublicId, 480, 270)}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#2E7D32] to-[#1A2E1A] flex items-center justify-center">
                      <span className="text-white/40 text-4xl font-bold">
                        {course.title.charAt(0)}
                      </span>
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex gap-1.5">
                    {course.isFeatured && (
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-[#F57F17] text-white rounded">
                        Featured
                      </span>
                    )}
                    {course.isOfflineEnabled && (
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-[#2E7D32] text-white rounded flex items-center gap-1">
                        <DownloadIcon className="h-3 w-3" />
                        Offline
                      </span>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-[#1B2B1B] line-clamp-2 leading-snug">
                    {course.title}
                  </h3>
                  {course.instructor?.profile?.displayName && (
                    <p className="text-xs text-[#5A6E5A] mt-1">
                      {course.instructor.profile.displayName}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-xs text-[#5A6E5A]">
                    <span className="flex items-center gap-0.5">
                      <Star className="h-3.5 w-3.5 text-[#F57F17] fill-[#F57F17]" />
                      {Number(course.averageRating || 0).toFixed(1)}
                    </span>
                    <span>({course.reviewCount ?? 0})</span>
                    <span className="flex items-center gap-0.5">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDuration(course.totalDuration ?? 0)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-bold text-[#1B2B1B]">
                    {Number(course.price) === 0
                      ? 'Free'
                      : `UGX ${Number(course.price).toLocaleString()}`}
                  </p>
                </div>
              </Link>
            ))}
      </div>

      {/* Mobile "View all" link */}
      <div className="mt-6 text-center sm:hidden">
        <Link
          to="/courses"
          className="text-sm font-medium text-[#2E7D32] hover:text-[#4CAF50] transition-colors"
        >
          View all courses &rarr;
        </Link>
      </div>
    </section>
  );
}
