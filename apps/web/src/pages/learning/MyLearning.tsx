import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchApi } from '@/lib/api';
import { toast } from 'sonner';
import { MyLearningHeader } from '@/components/farmer/MyLearningHeader';
import { WeeklyGoalWidget } from '@/components/farmer/WeeklyGoalWidget';
import { ScheduleNudgeCard } from '@/components/farmer/ScheduleNudgeCard';
import { CourseFilterBar } from '@/components/farmer/CourseFilterBar';
import { EnrolledCourseGrid, type EnrolledCourse } from '@/components/farmer/EnrolledCourseGrid';
import { ContinueLearningStrip } from '@/components/farmer/ContinueLearningStrip';
import { WishlistTab } from '@/components/farmer/WishlistTab';
import { CertificatesTab } from '@/components/farmer/CertificatesTab';
import CourseStrip from '@/components/course/CourseStrip';
import { Loader2 } from 'lucide-react';

interface RawEnrollment {
  id: string;
  courseId: string;
  progressPercent: number;
  lastAccessedAt?: string;
  createdAt: string;
  course: {
    id: string;
    slug: string;
    title: string;
    thumbnailPublicId: string | null;
    categoryId?: string;
    instructor: { profile?: { displayName: string } };
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

const VIEW_MODE_KEY = 'farmwise-my-learning-view';

export default function MyLearning() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'all';

  const [enrollments, setEnrollments] = useState<RawEnrollment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [progressFilter, setProgressFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(
    () => (localStorage.getItem(VIEW_MODE_KEY) as 'grid' | 'list') || 'grid'
  );

  // Recommendation state
  const [recCourses, setRecCourses] = useState<any[]>([]);
  const [recTitle, setRecTitle] = useState('');

  useEffect(() => {
    Promise.all([
      fetchApi('/enrollments'),
      fetchApi('/courses/categories'),
    ])
      .then(([enrollRes, catRes]) => {
        setEnrollments(enrollRes.enrollments || []);
        setCategories((catRes.categories || []).map((c: any) => ({ id: c.id, name: c.name, slug: c.slug })));
      })
      .catch(() => toast.error('Failed to load your courses'))
      .finally(() => setLoading(false));
  }, []);

  // Load recommendations
  useEffect(() => {
    if (enrollments.length === 0) return;
    const mostRecent = enrollments[0];
    if (!mostRecent) return;
    fetchApi(`/farmer/because-you-enrolled?courseId=${mostRecent.courseId}&limit=8`)
      .then(res => {
        if (res.courses?.length > 0) {
          setRecCourses(res.courses.map((c: any) => ({
            id: c.id, slug: c.slug, title: c.title, subtitle: c.subtitle,
            thumbnailPublicId: c.thumbnailPublicId, price: Number(c.price),
            averageRating: Number(c.averageRating), reviewCount: c._count?.reviews || 0,
            level: c.level, language: c.language, updatedAt: c.updatedAt,
            totalDuration: c.totalDuration, isFeatured: c.isFeatured,
            instructor: { name: c.instructor?.profile?.displayName || 'Instructor' },
            _count: c._count,
          })));
          setRecTitle(mostRecent.course.title);
        }
      })
      .catch(() => {});
  }, [enrollments]);

  // Apply tab filter
  useEffect(() => {
    if (activeTab === 'in_progress') setProgressFilter('in_progress');
    else setProgressFilter('all');
  }, [activeTab]);

  const handleTabChange = (tab: string) => {
    setSearchParams(tab === 'all' ? {} : { tab });
    setSearchQuery('');
    setSelectedCategories([]);
  };

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem(VIEW_MODE_KEY, mode);
  };

  // Map and filter enrollments
  const mappedCourses: EnrolledCourse[] = useMemo(() => {
    return enrollments.map(e => ({
      id: e.course.id,
      enrollmentId: e.id,
      slug: e.course.slug,
      title: e.course.title,
      thumbnailPublicId: e.course.thumbnailPublicId,
      instructor: { name: e.course.instructor?.profile?.displayName || 'Instructor' },
      completionPercent: e.progressPercent || 0,
      lastAccessedAt: e.lastAccessedAt,
    }));
  }, [enrollments]);

  const filteredCourses = useMemo(() => {
    let result = mappedCourses;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => c.title.toLowerCase().includes(q));
    }

    if (selectedCategories.length > 0) {
      const catIds = new Set(selectedCategories);
      result = result.filter(c => {
        const enrollment = enrollments.find(e => e.course.id === c.id);
        return enrollment?.course.categoryId && catIds.has(enrollment.course.categoryId);
      });
    }

    if (progressFilter === 'in_progress') {
      result = result.filter(c => c.completionPercent > 0 && c.completionPercent < 100);
    } else if (progressFilter === 'not_started') {
      result = result.filter(c => c.completionPercent === 0);
    } else if (progressFilter === 'completed') {
      result = result.filter(c => c.completionPercent >= 100);
    }

    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'title-az': return a.title.localeCompare(b.title);
        case 'title-za': return b.title.localeCompare(a.title);
        case 'newest': {
          const ae = enrollments.find(e => e.course.id === a.id);
          const be = enrollments.find(e => e.course.id === b.id);
          return new Date(be?.createdAt || 0).getTime() - new Date(ae?.createdAt || 0).getTime();
        }
        case 'oldest': {
          const ae = enrollments.find(e => e.course.id === a.id);
          const be = enrollments.find(e => e.course.id === b.id);
          return new Date(ae?.createdAt || 0).getTime() - new Date(be?.createdAt || 0).getTime();
        }
        default:
          return new Date(b.lastAccessedAt || 0).getTime() - new Date(a.lastAccessedAt || 0).getTime();
      }
    });

    return result;
  }, [mappedCourses, searchQuery, selectedCategories, progressFilter, sortBy, enrollments]);

  const continueCourses = useMemo(() => {
    return mappedCourses
      .filter(c => c.completionPercent > 0 && c.completionPercent < 100)
      .sort((a, b) => new Date(b.lastAccessedAt || 0).getTime() - new Date(a.lastAccessedAt || 0).getTime())
      .slice(0, 3)
      .map(c => ({
        slug: c.slug,
        title: c.title,
        thumbnailPublicId: c.thumbnailPublicId,
        lastLectureId: c.lastLectureId,
      }));
  }, [mappedCourses]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setProgressFilter('all');
    setSortBy('recent');
  };

  const isCoursesTab = activeTab === 'all' || activeTab === 'in_progress' || activeTab === 'archived';

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <MyLearningHeader activeTab={activeTab} onTabChange={handleTabChange} />
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="text-primary animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <MyLearningHeader activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Wishlist tab */}
      {activeTab === 'wishlist' && <WishlistTab />}

      {/* Certifications tab */}
      {activeTab === 'certifications' && <CertificatesTab />}

      {/* Courses tabs (all, in_progress, archived) */}
      {isCoursesTab && (
        <>
          {activeTab === 'all' && (
            <>
              <WeeklyGoalWidget />
              <ScheduleNudgeCard />
              {continueCourses.length > 0 && (
                <ContinueLearningStrip courses={continueCourses} />
              )}
            </>
          )}

          <CourseFilterBar
            categories={categories}
            filteredCount={filteredCourses.length}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategories={selectedCategories}
            onCategoriesChange={setSelectedCategories}
            progressFilter={progressFilter}
            onProgressChange={setProgressFilter}
            sortBy={sortBy}
            onSortChange={setSortBy}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
          />

          <EnrolledCourseGrid
            courses={filteredCourses}
            viewMode={viewMode}
            onClearFilters={clearAllFilters}
            hasEnrollments={enrollments.length > 0}
          />

          {activeTab === 'all' && recCourses.length > 0 && (
            <div className="px-4 md:px-6 lg:px-10 pb-10">
              <CourseStrip
                title={`Because you enrolled in "${recTitle}"`}
                courses={recCourses}
                isLoading={false}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
