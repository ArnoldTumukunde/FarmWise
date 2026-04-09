import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchApi } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Search,
  Download,
  MessageSquare,
  Users,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

interface Student {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    country?: string;
  };
  enrolledAt: string;
  progress: number;
  lastActive?: string;
  completedAt?: string;
}

type FilterTab = 'ALL' | 'IN_PROGRESS' | 'COMPLETED' | 'INACTIVE';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'INACTIVE', label: 'Inactive' },
];

function SkeletonTable() {
  return (
    <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-4 space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4 animate-pulse">
          <div className="w-8 h-8 bg-gray-200 rounded-full" />
          <div className="flex-1 h-4 bg-gray-200 rounded" />
          <div className="w-20 h-4 bg-gray-200 rounded" />
          <div className="w-32 h-3 bg-gray-200 rounded" />
          <div className="w-20 h-4 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-UG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function daysSince(dateStr?: string): number {
  if (!dateStr) return Infinity;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

export default function StudentList() {
  const { courseId } = useParams<{ courseId: string }>();
  const [students, setStudents] = useState<Student[]>([]);
  const [courseName, setCourseName] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');

  useEffect(() => {
    if (!courseId) return;
    fetchApi(`/instructor/courses/${courseId}`)
      .then((res) => {
        const course = res.course || res;
        setCourseName(course.title || '');
        const enrollments = course.enrollments || [];
        setStudents(
          enrollments.map((e: any) => ({
            id: e.id,
            user: e.user || { id: e.userId, name: e.userName || 'Student', email: e.userEmail || '' },
            enrolledAt: e.enrolledAt || e.createdAt,
            progress: e.progress ?? 0,
            lastActive: e.lastActive || e.updatedAt,
            completedAt: e.completedAt,
          }))
        );
      })
      .catch(() => toast.error('Failed to load students'))
      .finally(() => setLoading(false));
  }, [courseId]);

  const filteredStudents = students.filter((s) => {
    const matchesSearch = s.user.name.toLowerCase().includes(searchQuery.toLowerCase());
    switch (activeTab) {
      case 'IN_PROGRESS':
        return matchesSearch && s.progress > 0 && s.progress < 100;
      case 'COMPLETED':
        return matchesSearch && s.progress >= 100;
      case 'INACTIVE':
        return matchesSearch && daysSince(s.lastActive) >= 30;
      default:
        return matchesSearch;
    }
  });

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Enrolled Date', 'Progress', 'Last Active', 'Country'];
    const rows = filteredStudents.map((s) => [
      s.user.name,
      s.user.email,
      formatDate(s.enrolledAt),
      `${Math.round(s.progress)}%`,
      s.lastActive ? formatDate(s.lastActive) : 'N/A',
      s.user.country || 'N/A',
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students-${courseId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  return (
    <div className="bg-[#FAFAF5] min-h-screen p-4 md:p-8 font-[Inter]">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1B2B1B]">Students</h1>
            {courseName && (
              <p className="text-[#5A6E5A] text-sm mt-1">{courseName}</p>
            )}
          </div>
          <Button
            variant="outline"
            onClick={exportCSV}
            disabled={filteredStudents.length === 0}
            className="border-[#2E7D32]/20 text-[#1B2B1B]"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
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
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 border-[#2E7D32]/10"
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <SkeletonTable />
        ) : filteredStudents.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-12 text-center">
            <Users className="w-12 h-12 text-[#5A6E5A] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#1B2B1B] mb-2">No students found</h3>
            <p className="text-[#5A6E5A]">
              {searchQuery || activeTab !== 'ALL'
                ? 'Try adjusting your filters or search query.'
                : 'Students will appear here once they enroll.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#2E7D32]/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-[#5A6E5A]">
                    <th className="text-left px-4 py-3 font-medium">Name</th>
                    <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Enrolled</th>
                    <th className="text-left px-4 py-3 font-medium">Progress</th>
                    <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Last Active</th>
                    <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Country</th>
                    <th className="text-right px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr
                      key={student.id}
                      className="border-b border-gray-50 hover:bg-[#FAFAF5] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#2E7D32]/10 flex items-center justify-center text-[#2E7D32] font-semibold text-sm">
                            {student.user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-[#1B2B1B]">{student.user.name}</p>
                            <p className="text-xs text-[#5A6E5A] hidden sm:block">{student.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#1B2B1B] hidden md:table-cell">
                        {formatDate(student.enrolledAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 max-w-[120px] bg-gray-100 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                student.progress >= 100 ? 'bg-[#2E7D32]' : 'bg-[#F57F17]'
                              }`}
                              style={{ width: `${Math.min(student.progress, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-[#5A6E5A] min-w-[36px]">
                            {Math.round(student.progress)}%
                          </span>
                          {student.progress >= 100 && (
                            <CheckCircle2 className="w-4 h-4 text-[#2E7D32]" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#5A6E5A] hidden lg:table-cell">
                        {student.lastActive ? formatDate(student.lastActive) : '—'}
                      </td>
                      <td className="px-4 py-3 text-[#1B2B1B] hidden lg:table-cell">
                        {student.user.country || '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          className="p-1.5 rounded-md hover:bg-gray-100 text-[#5A6E5A] hover:text-[#1B2B1B]"
                          title="Message"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
