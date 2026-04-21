import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchApi } from '../../lib/api';
import { toast } from 'sonner';
import {
  CheckCircle,
  BookOpen,
  Loader2,
  Search,
  Star,
  Trash2,
  EyeOff,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const formatUGX = (amount: number) =>
  new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(amount);

const levelBadge: Record<string, string> = {
  BEGINNER: 'bg-green-50 text-green-700 ring-green-600/20',
  INTERMEDIATE: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  ADVANCED: 'bg-purple-50 text-purple-700 ring-purple-600/20',
};

const statusBadge: Record<string, string> = {
  DRAFT: 'bg-gray-50 text-gray-600 ring-gray-500/20',
  UNDER_REVIEW: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  PUBLISHED: 'bg-green-50 text-green-700 ring-green-600/20',
};

const statusLabel: Record<string, string> = {
  DRAFT: 'Draft',
  UNDER_REVIEW: 'Under Review',
  PUBLISHED: 'Published',
};

type StatusFilter = '' | 'PUBLISHED' | 'UNDER_REVIEW' | 'DRAFT';

const tabs: { label: string; value: StatusFilter }[] = [
  { label: 'All', value: '' },
  { label: 'Published', value: 'PUBLISHED' },
  { label: 'Under Review', value: 'UNDER_REVIEW' },
  { label: 'Draft', value: 'DRAFT' },
];

function SkeletonCourseCard() {
  return (
    <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-6 animate-pulse">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="space-y-3 flex-1">
          <div className="h-5 w-56 bg-[#2E7D32]/10 rounded" />
          <div className="h-3 w-36 bg-[#2E7D32]/10 rounded" />
          <div className="flex gap-4">
            <div className="h-4 w-24 bg-[#2E7D32]/10 rounded" />
            <div className="h-5 w-20 bg-[#2E7D32]/10 rounded-full" />
            <div className="h-5 w-20 bg-[#2E7D32]/10 rounded-full" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-36 bg-[#2E7D32]/10 rounded-lg" />
          <div className="h-10 w-32 bg-[#2E7D32]/10 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function CoursesLayout() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadCourses = useCallback(
    (s: StatusFilter, q: string, p: number) => {
      setLoading(true);
      const params = new URLSearchParams();
      if (s) params.set('status', s);
      if (q.trim()) params.set('search', q.trim());
      params.set('page', String(p));
      const qs = params.toString();

      fetchApi(`/admin/courses${qs ? `?${qs}` : ''}`)
        .then((res) => {
          setCourses(res.courses);
          setTotalPages(res.totalPages ?? 1);
          setTotal(res.total ?? 0);
          setPage(res.page ?? p);
        })
        .catch((e: any) => {
          toast.error(e.message || 'Failed to load courses');
        })
        .finally(() => setLoading(false));
    },
    [],
  );

  // Load on mount and whenever filter/page changes (not search -- that's debounced)
  useEffect(() => {
    loadCourses(statusFilter, search, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, page]);

  // Debounced search
  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      loadCourses(statusFilter, value, 1);
    }, 300);
  };

  const handleTabChange = (value: StatusFilter) => {
    setStatusFilter(value);
    setPage(1);
  };

  /* ---- Actions ---- */

  const moderateCourse = async (id: string, action: 'APPROVE' | 'REJECT') => {
    setActionLoading(id + action);
    try {
      await fetchApi(`/admin/courses/${id}/moderate`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      });
      toast.success(action === 'APPROVE' ? 'Course approved and published' : 'Course rejected to draft');
      loadCourses(statusFilter, search, page);
    } catch (e: any) {
      toast.error(e.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const unpublishCourse = async (id: string) => {
    setActionLoading(id + 'UNPUBLISH');
    try {
      await fetchApi(`/admin/courses/${id}/unpublish`, { method: 'POST' });
      toast.success('Course unpublished');
      loadCourses(statusFilter, search, page);
    } catch (e: any) {
      toast.error(e.message || 'Failed to unpublish');
    } finally {
      setActionLoading(null);
    }
  };

  const publishCourse = async (id: string) => {
    if (!window.confirm('Publish this course? It will be visible to all users.')) return;
    setActionLoading(id + 'PUBLISH');
    try {
      await fetchApi(`/admin/courses/${id}/publish`, { method: 'POST' });
      toast.success('Course published');
      loadCourses(statusFilter, search, page);
    } catch (e: any) {
      toast.error(e.message || 'Failed to publish');
    } finally {
      setActionLoading(null);
    }
  };

  const toggleFeatured = async (id: string, currentlyFeatured: boolean) => {
    setActionLoading(id + 'FEATURED');
    try {
      await fetchApi(`/admin/courses/${id}/featured`, {
        method: 'POST',
        body: JSON.stringify({ isFeatured: !currentlyFeatured }),
      });
      toast.success(!currentlyFeatured ? 'Course marked as featured' : 'Course removed from featured');
      loadCourses(statusFilter, search, page);
    } catch (e: any) {
      toast.error(e.message || 'Failed to toggle featured');
    } finally {
      setActionLoading(null);
    }
  };

  const deleteCourse = async (id: string, title: string) => {
    if (!window.confirm(`Permanently delete "${title}"? This cannot be undone.`)) return;
    setActionLoading(id + 'DELETE');
    try {
      await fetchApi(`/admin/courses/${id}`, { method: 'DELETE' });
      toast.success('Course deleted');
      loadCourses(statusFilter, search, page);
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete');
    } finally {
      setActionLoading(null);
    }
  };

  /* ---- Render helpers ---- */

  const renderActions = (course: any) => {
    const s = course.status;

    if (s === 'UNDER_REVIEW') {
      return (
        <>
          <button
            onClick={() => moderateCourse(course.id, 'APPROVE')}
            disabled={!!actionLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-[#2E7D32] text-white hover:bg-[#2E7D32]/90 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
          >
            {actionLoading === course.id + 'APPROVE' ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CheckCircle size={16} />
            )}
            Approve & Publish
          </button>
          <button
            onClick={() => moderateCourse(course.id, 'REJECT')}
            disabled={!!actionLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
          >
            {actionLoading === course.id + 'REJECT' && <Loader2 size={16} className="animate-spin" />}
            Reject to Draft
          </button>
        </>
      );
    }

    if (s === 'PUBLISHED') {
      return (
        <>
          <button
            onClick={() => unpublishCourse(course.id)}
            disabled={!!actionLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-50 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
          >
            {actionLoading === course.id + 'UNPUBLISH' ? <Loader2 size={16} className="animate-spin" /> : <EyeOff size={16} />}
            Unpublish
          </button>
          <button
            onClick={() => toggleFeatured(course.id, !!course.isFeatured)}
            disabled={!!actionLoading}
            title={course.isFeatured ? 'Remove from featured' : 'Mark as featured'}
            className={`inline-flex items-center justify-center w-10 h-10 rounded-lg border transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2 ${
              course.isFeatured
                ? 'bg-amber-50 border-amber-300 text-amber-500 hover:bg-amber-100'
                : 'border-[#2E7D32]/20 text-[#5A6E5A] hover:bg-[#FAFAF5]'
            }`}
          >
            {actionLoading === course.id + 'FEATURED' ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Star size={16} className={course.isFeatured ? 'fill-amber-400' : ''} />
            )}
          </button>
          <button
            onClick={() => deleteCourse(course.id, course.title)}
            disabled={!!actionLoading}
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
            title="Delete course"
          >
            {actionLoading === course.id + 'DELETE' ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
          </button>
        </>
      );
    }

    // DRAFT
    return (
      <>
        <button
          onClick={() => publishCourse(course.id)}
          disabled={!!actionLoading}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-[#2E7D32] text-white hover:bg-[#2E7D32]/90 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
        >
          {actionLoading === course.id + 'PUBLISH' ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
          Publish Now
        </button>
        <button
          onClick={() => deleteCourse(course.id, course.title)}
          disabled={!!actionLoading}
          className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
          title="Delete course"
        >
          {actionLoading === course.id + 'DELETE' ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
        </button>
      </>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1B2B1B]">Course Management</h1>
        <p className="text-sm text-[#5A6E5A] mt-1">
          Browse, moderate, and manage all courses on the platform
        </p>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Status tabs */}
        <div className="flex gap-1 bg-[#FAFAF5] p-1 rounded-lg border border-[#2E7D32]/10">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleTabChange(tab.value)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                statusFilter === tab.value
                  ? 'bg-white text-[#1B2B1B] shadow-sm'
                  : 'text-[#5A6E5A] hover:text-[#1B2B1B]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A6E5A]" />
          <input
            type="text"
            placeholder="Search courses by title..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-[#2E7D32]/20 bg-white text-[#1B2B1B] placeholder:text-[#5A6E5A]/60 focus:outline-none focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent transition-colors"
          />
        </div>
      </div>

      {/* Course list */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCourseCard key={i} />)
        ) : courses.length > 0 ? (
          courses.map((course) => {
            const price = Number(course.price);
            return (
              <div
                key={course.id}
                className="bg-white rounded-xl border border-[#2E7D32]/10 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-1">
                      <h3 className="text-lg font-semibold text-[#1B2B1B]">{course.title}</h3>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ring-1 ring-inset ${
                          statusBadge[course.status] || 'bg-gray-50 text-gray-600'
                        }`}
                      >
                        {statusLabel[course.status] || course.status}
                      </span>
                      {course.isFeatured && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                          <Star size={12} className="fill-amber-400" />
                          Featured
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#5A6E5A] mb-3">
                      By{' '}
                      <span className="font-medium text-[#1B2B1B]">
                        {course.instructor?.profile?.displayName || 'Unknown'}
                      </span>
                    </p>
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="text-sm font-semibold text-[#1B2B1B]">
                        {price === 0 ? 'Free' : formatUGX(price)}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ring-1 ring-inset ${
                          levelBadge[course.level] || 'bg-gray-50 text-gray-700'
                        }`}
                      >
                        {course.level}
                      </span>
                      <span className="text-xs text-[#5A6E5A]">
                        Created {new Date(course.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 sm:items-start flex-wrap">
                    {renderActions(course)}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-xl border border-[#2E7D32]/10 py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-[#2E7D32]/5 flex items-center justify-center mx-auto mb-4">
              <BookOpen size={28} className="text-[#5A6E5A]" />
            </div>
            <p className="text-[#1B2B1B] font-semibold mb-1">No courses found</p>
            <p className="text-sm text-[#5A6E5A]">
              {search
                ? `No courses match "${search}"${statusFilter ? ` in ${statusLabel[statusFilter]}` : ''}.`
                : statusFilter
                  ? `No ${statusLabel[statusFilter].toLowerCase()} courses yet.`
                  : 'There are no courses on the platform yet.'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-xl border border-[#2E7D32]/10 px-6 py-4">
          <p className="text-sm text-[#5A6E5A]">
            Page {page} of {totalPages} ({total} course{total !== 1 ? 's' : ''})
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg border border-[#2E7D32]/20 text-[#1B2B1B] hover:bg-[#FAFAF5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            {/* Page numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | 'gap')[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('gap');
                acc.push(p);
                return acc;
              }, [])
              .map((item, idx) =>
                item === 'gap' ? (
                  <span key={`gap-${idx}`} className="px-2 text-[#5A6E5A]">
                    ...
                  </span>
                ) : (
                  <button
                    key={item}
                    onClick={() => setPage(item as number)}
                    disabled={loading}
                    className={`w-9 h-9 text-sm font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2 ${
                      page === item
                        ? 'bg-[#2E7D32] text-white'
                        : 'text-[#1B2B1B] hover:bg-[#FAFAF5] border border-transparent'
                    }`}
                  >
                    {item}
                  </button>
                ),
              )}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg border border-[#2E7D32]/20 text-[#1B2B1B] hover:bg-[#FAFAF5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
