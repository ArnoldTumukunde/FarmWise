import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { formatUGX, cloudinaryImageUrl } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Plus,
  X,
  Users,
  Banknote,
  Star,
  BookOpen,
  BarChart3,
  Pencil,
  Sprout,
  Loader2,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

interface InstructorCourse {
  id: string;
  title: string;
  status: string;
  price: string;
  thumbnailPublicId?: string;
  category: { name: string };
  _count?: { enrollments: number; reviews: number };
  averageRating?: number;
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  UNDER_REVIEW: 'bg-amber-100 text-amber-700',
  PUBLISHED: 'bg-[#2E7D32]/10 text-[#2E7D32]',
  UNPUBLISHED: 'bg-red-100 text-red-700',
};

function SkeletonDashboard() {
  return (
    <div className="bg-[#FAFAF5] min-h-screen p-4 md:p-8 font-[Inter]">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 animate-pulse">
          <div className="h-7 w-56 bg-gray-200 rounded" />
          <div className="h-4 w-72 bg-gray-100 rounded mt-2" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white p-5 rounded-xl border border-gray-200 animate-pulse">
              <div className="h-4 w-20 bg-gray-200 rounded" />
              <div className="h-8 w-16 bg-gray-200 rounded mt-2" />
            </div>
          ))}
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 animate-pulse">
            <div className="h-5 w-48 bg-gray-200 rounded" />
            <div className="h-4 w-32 bg-gray-100 rounded mt-3" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function InstructorDashboard() {
  const [courses, setCourses] = useState<InstructorCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    Promise.all([fetchApi('/instructor/courses'), fetchApi('/courses/categories')])
      .then(([courseRes, catRes]) => {
        setCourses(courseRes.courses);
        setCategories(catRes.categories);
        if (catRes.categories.length > 0) setNewCategory(catRes.categories[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const res = await fetchApi('/instructor/courses', {
        method: 'POST',
        body: JSON.stringify({ title: newTitle, categoryId: newCategory }),
      });
      const newCourse = { ...res.course, category: res.course.category || { name: 'Uncategorized' } };
      setCourses([newCourse, ...courses]);
      setShowCreate(false);
      setNewTitle('');
      toast.success('Course created! Start building your curriculum.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create course');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!window.confirm('Are you sure you want to delete this course? This cannot be undone.')) return;
    try {
      await fetchApi(`/instructor/courses/${courseId}`, { method: 'DELETE' });
      setCourses(prev => prev.filter(c => c.id !== courseId));
      toast.success('Course deleted successfully.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete course');
    }
  };

  if (loading) return <SkeletonDashboard />;

  // Stats
  const totalStudents = courses.reduce((sum, c) => sum + (c._count?.enrollments ?? 0), 0);
  const totalRevenue = courses.reduce(
    (sum, c) => sum + (c._count?.enrollments ?? 0) * Number(c.price || 0),
    0
  );
  const avgRating =
    courses.length > 0
      ? courses.reduce((sum, c) => sum + Number(c.averageRating || 0), 0) / courses.length
      : 0;

  const stats = [
    { label: 'Total Students', value: totalStudents, icon: Users, color: 'text-blue-600' },
    {
      label: 'Total Revenue',
      value: formatUGX(totalRevenue),
      icon: Banknote,
      color: 'text-[#2E7D32]',
    },
    {
      label: 'Avg. Rating',
      value: avgRating > 0 ? avgRating.toFixed(1) : '--',
      icon: Star,
      color: 'text-[#F57F17]',
    },
    { label: 'Courses', value: courses.length, icon: BookOpen, color: 'text-purple-600' },
  ];

  return (
    <div className="bg-[#FAFAF5] min-h-screen p-4 md:p-8 font-[Inter]">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-[#1B2B1B]">Instructor Dashboard</h1>
            <p className="text-[#5A6E5A] mt-1 text-sm">
              Manage your courses and track performance.
            </p>
          </div>
          <Button
            onClick={() => setShowCreate(true)}
            className="bg-[#2E7D32] hover:bg-[#2E7D32]/90 text-white focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
          >
            <Plus size={18} className="mr-2" />
            Create New Course
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(stat => (
            <div
              key={stat.label}
              className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm"
            >
              <div className="flex items-center gap-2 text-[#5A6E5A] text-sm mb-1">
                <stat.icon size={16} className={stat.color} />
                {stat.label}
              </div>
              <div className="text-2xl font-bold text-[#1B2B1B]">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Create Course Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between p-5 border-b border-gray-200">
                <h2 className="text-lg font-bold text-[#1B2B1B]">Create a New Course</h2>
                <button
                  onClick={() => setShowCreate(false)}
                  className="p-1.5 rounded-md hover:bg-gray-100 transition-colors focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                >
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleCreate} className="p-5 space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#1B2B1B]">Course Title</Label>
                  <Input
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="e.g. Modern Drip Irrigation Setup"
                    required
                    className="focus-visible:ring-[#2E7D32]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#1B2B1B]">Category</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                    onClick={() => setShowCreate(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={creating || !newTitle.trim()}
                    className="flex-1 bg-[#2E7D32] hover:bg-[#2E7D32]/90 focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                  >
                    {creating ? (
                      <Loader2 size={16} className="animate-spin mr-2" />
                    ) : (
                      <Plus size={16} className="mr-2" />
                    )}
                    Create Course
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Course List */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-[#1B2B1B]">Your Courses</h2>

          {courses.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-300">
              <div className="w-16 h-16 mx-auto bg-[#2E7D32]/10 rounded-full flex items-center justify-center mb-4">
                <Sprout size={32} className="text-[#2E7D32]" />
              </div>
              <h3 className="text-lg font-semibold text-[#1B2B1B] mb-2">No courses yet</h3>
              <p className="text-[#5A6E5A] text-sm max-w-sm mx-auto">
                Create your first course to start teaching farmers!
              </p>
              <Button
                onClick={() => setShowCreate(true)}
                className="mt-6 bg-[#2E7D32] hover:bg-[#2E7D32]/90 focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
              >
                <Plus size={16} className="mr-2" />
                Create Your First Course
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {courses.map(course => (
                <div
                  key={course.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-5 flex flex-col md:flex-row gap-5">
                    {/* Thumbnail */}
                    <div className="w-full md:w-40 aspect-video md:aspect-[16/10] rounded-lg overflow-hidden bg-gray-100 shrink-0">
                      {course.thumbnailPublicId ? (
                        <img
                          src={cloudinaryImageUrl(course.thumbnailPublicId!, 320, 200)}
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#2E7D32]/10 to-[#4CAF50]/5">
                          <Sprout size={24} className="text-[#2E7D32]/30" />
                        </div>
                      )}
                    </div>

                    {/* Course Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3 flex-wrap">
                        <h3 className="text-lg font-semibold text-[#1B2B1B] leading-tight">
                          {course.title}
                        </h3>
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${STATUS_STYLES[course.status] || 'bg-gray-100 text-gray-700'}`}
                        >
                          {course.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-[#5A6E5A]">
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                          {course.category.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={14} />
                          {course._count?.enrollments ?? 0} student{(course._count?.enrollments ?? 0) !== 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star size={14} className="text-[#F57F17]" />
                          {course._count?.reviews ?? 0} review{(course._count?.reviews ?? 0) !== 1 ? 's' : ''}
                        </span>
                        <span className="font-semibold text-[#1B2B1B]">
                          {formatUGX(course.price)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 md:flex-col md:justify-center shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 md:flex-none border-[#2E7D32] text-[#2E7D32] hover:bg-[#2E7D32]/5 focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                        asChild
                      >
                        <Link to={`/instructor/course/${course.id}`}>
                          <Pencil size={14} className="mr-1.5" />
                          Edit Content
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 md:flex-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                        asChild
                      >
                        <Link to={`/instructor/courses/${course.id}/analytics`}>
                          <BarChart3 size={14} className="mr-1.5" />
                          View Analytics
                        </Link>
                      </Button>
                      {course.status === 'DRAFT' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 md:flex-none border-red-300 text-red-600 hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                          onClick={() => handleDeleteCourse(course.id)}
                        >
                          <Trash2 size={14} className="mr-1.5" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
