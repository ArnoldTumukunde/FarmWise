import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { formatUGX, cloudinaryImageUrl } from '@/lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Plus,
  Search,
  Pencil,
  Eye,
  MoreHorizontal,
  Trash2,
  Copy,
  EyeOff,
  Loader2,
  BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';

interface Course {
  id: string;
  slug?: string;
  title: string;
  status: string;
  price: string;
  thumbnailPublicId?: string;
  category?: { name: string };
  _count?: { enrollments: number; reviews: number };
  averageRating?: number;
  totalRevenue?: number;
}

type FilterTab = 'ALL' | 'PUBLISHED' | 'DRAFT' | 'PENDING_REVIEW';

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  PENDING_REVIEW: 'bg-amber-100 text-amber-700',
  UNDER_REVIEW: 'bg-amber-100 text-amber-700',
  PUBLISHED: 'bg-[#2E7D32]/10 text-[#2E7D32]',
  UNPUBLISHED: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  PENDING_REVIEW: 'Pending Review',
  UNDER_REVIEW: 'Under Review',
  PUBLISHED: 'Published',
  UNPUBLISHED: 'Unpublished',
};

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'PUBLISHED', label: 'Published' },
  { key: 'DRAFT', label: 'Draft' },
  { key: 'PENDING_REVIEW', label: 'Pending Review' },
];

function SkeletonTable() {
  return (
    <div className="bg-white rounded-xl border border-[#2E7D32]/10 overflow-hidden">
      <div className="p-4 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 animate-pulse">
            <div className="w-16 h-10 bg-gray-200 rounded" />
            <div className="flex-1 h-4 bg-gray-200 rounded" />
            <div className="w-16 h-4 bg-gray-200 rounded" />
            <div className="w-12 h-4 bg-gray-200 rounded" />
            <div className="w-20 h-4 bg-gray-200 rounded" />
            <div className="w-16 h-6 bg-gray-200 rounded-full" />
            <div className="w-20 h-4 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MyCourses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchApi('/instructor/courses')
      .then((res) => setCourses(res.courses || res.data || res))
      .catch(() => toast.error('Failed to load courses'))
      .finally(() => setLoading(false));
  }, []);

  const filteredCourses = courses.filter((c) => {
    const matchesTab =
      activeTab === 'ALL' ||
      c.status === activeTab ||
      (activeTab === 'PENDING_REVIEW' && c.status === 'UNDER_REVIEW');
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleDelete = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course? This cannot be undone.')) return;
    setActionLoading(courseId);
    try {
      await fetchApi(`/instructor/courses/${courseId}`, { method: 'DELETE' });
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
      toast.success('Course deleted');
    } catch {
      toast.error('Failed to delete course');
    } finally {
      setActionLoading(null);
      setOpenMenuId(null);
    }
  };

  const handleDuplicate = async (courseId: string) => {
    setActionLoading(courseId);
    try {
      const res = await fetchApi(`/instructor/courses/${courseId}/duplicate`, { method: 'POST' });
      const newCourse = res.course || res;
      setCourses((prev) => [newCourse, ...prev]);
      toast.success('Course duplicated');
    } catch {
      toast.error('Failed to duplicate course');
    } finally {
      setActionLoading(null);
      setOpenMenuId(null);
    }
  };

  const handleUnpublish = async (courseId: string) => {
    setActionLoading(courseId);
    try {
      await fetchApi(`/instructor/courses/${courseId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'UNPUBLISHED' }),
      });
      setCourses((prev) =>
        prev.map((c) => (c.id === courseId ? { ...c, status: 'UNPUBLISHED' } : c))
      );
      toast.success('Course unpublished');
    } catch {
      toast.error('Failed to unpublish course');
    } finally {
      setActionLoading(null);
      setOpenMenuId(null);
    }
  };

  return (
    <div className="p-4 md:p-8 font-[Inter]">
      <div className="max-w-[1200px] space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1B2B1B]">My Courses</h1>
            <p className="text-[#5A6E5A] text-sm mt-1">
              Manage and track all your courses
            </p>
          </div>
          <Button
            className="bg-[#2E7D32] hover:bg-[#256329] text-white"
            onClick={() => navigate('/instructor/courses/new')}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Course
          </Button>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-1 bg-white rounded-lg border border-[#2E7D32]/10 p-1">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  activeTab === tab.key
                    ? 'bg-[#2E7D32] text-white'
                    : 'text-[#5A6E5A] hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6E5A]" />
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 border-[#2E7D32]/10"
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <SkeletonTable />
        ) : filteredCourses.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-12 text-center">
            <BookOpen className="w-12 h-12 text-[#5A6E5A] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#1B2B1B] mb-2">No courses found</h3>
            <p className="text-[#5A6E5A] mb-6">
              {searchQuery || activeTab !== 'ALL'
                ? 'Try adjusting your filters or search query.'
                : 'Create your first course to get started.'}
            </p>
            {!searchQuery && activeTab === 'ALL' && (
              <Button
                className="bg-[#2E7D32] hover:bg-[#256329] text-white"
                onClick={() => navigate('/instructor/courses/new')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Course
              </Button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#2E7D32]/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-[#5A6E5A]">
                    <th className="text-left px-4 py-3 font-medium">Course</th>
                    <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Students</th>
                    <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Rating</th>
                    <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Revenue</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-right px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCourses.map((course) => (
                    <tr
                      key={course.id}
                      className="border-b border-gray-50 hover:bg-[#FAFAF5] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {course.thumbnailPublicId ? (
                            <img
                              src={cloudinaryImageUrl(course.thumbnailPublicId, 80, 45)}
                              alt=""
                              className="w-16 h-10 rounded object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-16 h-10 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <BookOpen className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                          <span className="font-medium text-[#1B2B1B] line-clamp-1">
                            {course.title}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#1B2B1B] hidden md:table-cell">
                        {course._count?.enrollments ?? 0}
                      </td>
                      <td className="px-4 py-3 text-[#1B2B1B] hidden md:table-cell">
                        {course.averageRating != null
                          ? `${Number(course.averageRating).toFixed(1)} ★`
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-[#1B2B1B] hidden lg:table-cell">
                        {formatUGX(course.totalRevenue ?? 0)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            STATUS_STYLES[course.status] || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {STATUS_LABELS[course.status] || course.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/instructor/course/${course.id}`}
                            className="p-1.5 rounded-md hover:bg-gray-100 text-[#5A6E5A] hover:text-[#1B2B1B]"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </Link>
                          {course.status === 'PUBLISHED' && course.slug && (
                            <Link
                              to={`/courses/${course.slug}`}
                              className="p-1.5 rounded-md hover:bg-gray-100 text-[#5A6E5A] hover:text-[#1B2B1B]"
                              title="View Live"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                          )}
                          <div className="relative">
                            <button
                              onClick={() =>
                                setOpenMenuId(openMenuId === course.id ? null : course.id)
                              }
                              className="p-1.5 rounded-md hover:bg-gray-100 text-[#5A6E5A] hover:text-[#1B2B1B]"
                            >
                              {actionLoading === course.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <MoreHorizontal className="w-4 h-4" />
                              )}
                            </button>
                            {openMenuId === course.id && (
                              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg border border-gray-200 shadow-lg z-20 py-1">
                                <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#5A6E5A]/60">
                                  Manage
                                </p>
                                <Link
                                  to={`/instructor/courses/${course.id}/students`}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#1B2B1B] hover:bg-gray-50"
                                >
                                  Students
                                </Link>
                                <Link
                                  to={`/instructor/courses/${course.id}/qa`}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#1B2B1B] hover:bg-gray-50"
                                >
                                  Q&A
                                </Link>
                                <Link
                                  to={`/instructor/courses/${course.id}/reviews`}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#1B2B1B] hover:bg-gray-50"
                                >
                                  Reviews
                                </Link>
                                <Link
                                  to={`/instructor/courses/${course.id}/announcements`}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#1B2B1B] hover:bg-gray-50"
                                >
                                  Announcements
                                </Link>
                                <Link
                                  to={`/instructor/courses/${course.id}/analytics`}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#1B2B1B] hover:bg-gray-50"
                                >
                                  Analytics
                                </Link>
                                <div className="border-t border-gray-100 my-1" />
                                {course.status === 'PUBLISHED' && (
                                  <button
                                    onClick={() => handleUnpublish(course.id)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#1B2B1B] hover:bg-gray-50"
                                  >
                                    <EyeOff className="w-4 h-4" />
                                    Unpublish
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDuplicate(course.id)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#1B2B1B] hover:bg-gray-50"
                                >
                                  <Copy className="w-4 h-4" />
                                  Duplicate
                                </button>
                                <button
                                  onClick={() => handleDelete(course.id)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Click-away listener for menus */}
      {openMenuId && (
        <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
      )}
    </div>
  );
}
