import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '../../lib/api';
import {
  Users,
  BookOpen,
  DollarSign,
  DownloadCloud,
  Clock,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

const formatUGX = (amount: number) =>
  new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(amount);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' });

/* ── Skeleton loaders ────────────────────────────────────── */

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-3 flex-1">
          <div className="h-3 w-24 bg-[#2E7D32]/10 rounded" />
          <div className="h-8 w-20 bg-[#2E7D32]/10 rounded" />
        </div>
        <div className="w-12 h-12 rounded-full bg-[#2E7D32]/10" />
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="py-4 flex justify-between items-center animate-pulse">
      <div className="space-y-2">
        <div className="h-4 w-36 bg-[#2E7D32]/10 rounded" />
        <div className="h-3 w-48 bg-[#2E7D32]/10 rounded" />
      </div>
      <div className="h-6 w-20 bg-[#2E7D32]/10 rounded-full" />
    </div>
  );
}

function SkeletonTableRow() {
  return (
    <tr className="animate-pulse">
      <td className="py-3 pr-4"><div className="h-4 w-28 bg-[#2E7D32]/10 rounded" /></td>
      <td className="py-3 pr-4"><div className="h-5 w-16 bg-[#2E7D32]/10 rounded-full" /></td>
      <td className="py-3"><div className="h-4 w-20 bg-[#2E7D32]/10 rounded" /></td>
    </tr>
  );
}

/* ── Badge helpers ────────────────────────────────────────── */

const roleBadge: Record<string, string> = {
  ADMIN: 'bg-red-50 text-red-700 ring-red-600/20',
  INSTRUCTOR: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  STUDENT: 'bg-gray-50 text-gray-600 ring-gray-500/20',
};

const statusBadge: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: 'Draft', cls: 'bg-gray-50 text-gray-600 ring-gray-500/20' },
  UNDER_REVIEW: { label: 'Under Review', cls: 'bg-amber-50 text-amber-700 ring-amber-600/20' },
  PUBLISHED: { label: 'Published', cls: 'bg-green-50 text-[#2E7D32] ring-[#2E7D32]/20' },
};

/* ── KPI config ───────────────────────────────────────────── */

const kpiConfig = [
  { key: 'totalUsers', title: 'Total Users', icon: Users, bg: 'bg-blue-50', text: 'text-blue-600', format: (v: number) => v.toLocaleString() },
  { key: 'activeCourses', title: 'Active Courses', icon: BookOpen, bg: 'bg-green-50', text: 'text-[#2E7D32]', format: (v: number) => v.toLocaleString() },
  { key: 'totalRevenue', title: 'Total Revenue', icon: DollarSign, bg: 'bg-emerald-50', text: 'text-emerald-600', format: (v: number) => formatUGX(v) },
  { key: 'totalDownloads', title: 'Offline Downloads', icon: DownloadCloud, bg: 'bg-purple-50', text: 'text-purple-600', format: (v: number) => v.toLocaleString() },
  { key: 'pendingCoursesCount', title: 'Pending Courses', icon: Clock, bg: 'bg-amber-50', text: 'text-amber-600', format: (v: number) => v.toLocaleString() },
  { key: 'flaggedReviewsCount', title: 'Flagged Reviews', icon: AlertTriangle, bg: 'bg-red-50', text: 'text-red-600', format: (v: number) => v.toLocaleString() },
];

/* ── Main component ───────────────────────────────────────── */

export function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApi('/admin/dashboard')
      .then(data => setStats(data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <span className="text-red-500 text-2xl">!</span>
        </div>
        <p className="text-[#1B2B1B] font-semibold mb-1">Failed to load dashboard</p>
        <p className="text-sm text-[#5A6E5A]">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1B2B1B]">Platform Overview</h1>
        <p className="text-sm text-[#5A6E5A] mt-1">Key metrics and recent activity</p>
      </div>

      {/* ── KPI Cards (3 columns on desktop, 2 on tablet, 1 on mobile) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : kpiConfig.map((kpi) => {
              const Icon = kpi.icon;
              const raw = stats?.[kpi.key];
              const value = kpi.key === 'totalRevenue' ? Number(raw || 0) : (raw || 0);
              return (
                <div
                  key={kpi.key}
                  className="bg-white rounded-xl border border-[#2E7D32]/10 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#5A6E5A] mb-2">{kpi.title}</p>
                      <p className="text-2xl font-bold text-[#1B2B1B]">{kpi.format(value)}</p>
                    </div>
                    <div
                      className={`w-12 h-12 rounded-full ${kpi.bg} ${kpi.text} flex items-center justify-center flex-shrink-0`}
                    >
                      <Icon size={22} />
                    </div>
                  </div>
                </div>
              );
            })}
      </div>

      {/* ── Two-column: Recent Users + Recent Courses ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-white rounded-xl border border-[#2E7D32]/10">
          <div className="px-6 py-4 border-b border-[#2E7D32]/10 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#1B2B1B]">Recent Users</h2>
              <p className="text-sm text-[#5A6E5A]">Latest accounts created</p>
            </div>
            <Link
              to="/admin/users"
              className="text-sm font-medium text-[#2E7D32] hover:underline flex items-center gap-1"
            >
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="px-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[#5A6E5A] border-b border-[#2E7D32]/5">
                  <th className="py-3 pr-4 font-medium">Name</th>
                  <th className="py-3 pr-4 font-medium">Role</th>
                  <th className="py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2E7D32]/5">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonTableRow key={i} />)
                ) : stats?.recentUsers?.length > 0 ? (
                  stats.recentUsers.map((user: any) => (
                    <tr key={user.id}>
                      <td className="py-3 pr-4">
                        <p className="font-semibold text-[#1B2B1B] truncate max-w-[160px]">
                          {user.profile?.displayName || user.email}
                        </p>
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full ring-1 ring-inset ${
                            roleBadge[user.role] || roleBadge.STUDENT
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 text-[#5A6E5A] whitespace-nowrap">
                        {formatDate(user.createdAt)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-10 text-center text-[#5A6E5A]">
                      No users yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Courses */}
        <div className="bg-white rounded-xl border border-[#2E7D32]/10">
          <div className="px-6 py-4 border-b border-[#2E7D32]/10 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#1B2B1B]">Recent Courses</h2>
              <p className="text-sm text-[#5A6E5A]">Latest courses added</p>
            </div>
            <Link
              to="/admin/courses"
              className="text-sm font-medium text-[#2E7D32] hover:underline flex items-center gap-1"
            >
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="px-6">
            {loading ? (
              <div className="divide-y divide-[#2E7D32]/5">
                {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
              </div>
            ) : stats?.recentCourses?.length > 0 ? (
              <div className="divide-y divide-[#2E7D32]/5">
                {stats.recentCourses.map((course: any) => {
                  const badge = statusBadge[course.status] || statusBadge.DRAFT;
                  return (
                    <div key={course.id} className="py-4 flex justify-between items-start gap-4">
                      <div className="min-w-0">
                        <p className="font-semibold text-[#1B2B1B] truncate">{course.title}</p>
                        <p className="text-sm text-[#5A6E5A] truncate">
                          by {course.instructor?.profile?.displayName || 'Unknown'} &middot;{' '}
                          {formatDate(course.createdAt)}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ring-1 ring-inset whitespace-nowrap ${badge.cls}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-10 text-center">
                <div className="w-12 h-12 rounded-full bg-[#2E7D32]/5 flex items-center justify-center mx-auto mb-3">
                  <BookOpen size={20} className="text-[#5A6E5A]" />
                </div>
                <p className="text-[#5A6E5A] text-sm">No courses yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Pending Applications ── */}
      <div className="bg-white rounded-xl border border-[#2E7D32]/10">
        <div className="px-6 py-4 border-b border-[#2E7D32]/10 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#1B2B1B]">Pending Applications</h2>
            <p className="text-sm text-[#5A6E5A]">Instructor applications awaiting review</p>
          </div>
          <Link
            to="/admin/users"
            className="text-sm font-medium text-[#2E7D32] hover:underline flex items-center gap-1"
          >
            View All <ArrowRight size={14} />
          </Link>
        </div>
        <div className="px-6">
          {loading ? (
            <div className="divide-y divide-[#2E7D32]/5">
              {Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}
            </div>
          ) : stats?.pendingApplications?.length > 0 ? (
            <div className="divide-y divide-[#2E7D32]/5">
              {stats.pendingApplications.map((app: any) => (
                <div key={app.id} className="py-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-[#1B2B1B]">
                      {app.user?.profile?.displayName || 'Unknown'}
                    </p>
                    <p className="text-sm text-[#5A6E5A]">{app.user?.email}</p>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20">
                    PENDING
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center">
              <div className="w-12 h-12 rounded-full bg-[#2E7D32]/5 flex items-center justify-center mx-auto mb-3">
                <Users size={20} className="text-[#5A6E5A]" />
              </div>
              <p className="text-[#5A6E5A] text-sm">No pending instructor applications.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
