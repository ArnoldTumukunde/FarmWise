import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { formatUGX, cloudinaryImageUrl } from '@/lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Banknote,
  Star,
  MessageSquare,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Bell,
  Plus,
  BookOpen,
  TrendingUp,
  Sprout,
  Clock,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

/* ── Types ─────────────────────────────────────────────── */

interface KPI {
  totalStudents: number;
  thisMonthRevenue: number;
  lastMonthRevenue: number;
  averageRating: number;
  totalReviews: number;
  totalCourses: number;
}

interface RevMonthPoint {
  month: string;
  total: number;
  net: number;
}

interface CourseSummary {
  id: string;
  title: string;
  status: string;
  thumbnailPublicId?: string;
  studentCount: number;
  averageRating: number;
  totalRevenue?: number;
}

interface EnrollmentActivity {
  studentName: string;
  courseTitle: string;
  timeAgo: string;
}

interface DashboardData {
  kpi: KPI;
  revenueChart: RevMonthPoint[];
  topCourses: CourseSummary[];
  recentActivity: EnrollmentActivity[];
  unansweredQACount: number;
}

/* ── Helpers ───────────────────────────────────────────── */

const formatCompact = (v: number) => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return v.toLocaleString();
};

/* ── Skeleton ──────────────────────────────────────────── */

function Skeleton() {
  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="h-7 w-40 bg-gray-200 rounded animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-5 animate-pulse">
            <div className="h-3 w-16 bg-gray-200 rounded mb-3" />
            <div className="h-7 w-20 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-6 h-72 animate-pulse" />
    </div>
  );
}

/* ── Main Component ────────────────────────────────────── */

export default function InstructorDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [analytics, coursesRes] = await Promise.all([
          fetchApi('/instructor/analytics').catch(() => null),
          fetchApi('/instructor/courses').catch(() => ({ courses: [] })),
        ]);

        const courses = coursesRes.courses || coursesRes.data || coursesRes || [];

        const totalStudents = courses.reduce(
          (s: number, c: any) => s + (c._count?.enrollments ?? 0), 0
        );
        const totalReviews = courses.reduce(
          (s: number, c: any) => s + (c._count?.reviews ?? 0), 0
        );
        const avgRating =
          courses.length > 0
            ? courses.reduce((s: number, c: any) => s + Number(c.averageRating || 0), 0) / courses.length
            : 0;

        const thisMonthRevenue = analytics?.thisMonthRevenue ?? 0;
        const lastMonthRevenue = analytics?.lastMonthRevenue ?? 0;

        const topCourses = [...courses]
          .sort((a: any, b: any) => (b._count?.enrollments ?? 0) - (a._count?.enrollments ?? 0))
          .slice(0, 5)
          .map((c: any) => ({
            id: c.id,
            title: c.title,
            status: c.status,
            thumbnailPublicId: c.thumbnailPublicId,
            studentCount: c._count?.enrollments ?? 0,
            averageRating: Number(c.averageRating || 0),
            totalRevenue: c.totalRevenue ?? 0,
          }));

        const revenueChart: RevMonthPoint[] = analytics?.revenueByMonth || [];
        const recentActivity: EnrollmentActivity[] = analytics?.recentEnrollments || [];
        const unansweredQACount = analytics?.unansweredQACount ?? 0;

        setData({
          kpi: {
            totalStudents,
            thisMonthRevenue,
            lastMonthRevenue,
            averageRating: avgRating,
            totalReviews,
            totalCourses: courses.length,
          },
          revenueChart,
          topCourses,
          recentActivity,
          unansweredQACount,
        });
      } catch (e: any) {
        setError(e.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Skeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center p-8">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <span className="text-red-500 text-xl font-bold">!</span>
        </div>
        <p className="text-[#1B2B1B] font-semibold mb-1">Failed to load dashboard</p>
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const { kpi, revenueChart, topCourses, recentActivity, unansweredQACount } = data;

  const revDelta =
    kpi.lastMonthRevenue > 0
      ? ((kpi.thisMonthRevenue - kpi.lastMonthRevenue) / kpi.lastMonthRevenue) * 100
      : kpi.thisMonthRevenue > 0
        ? 100
        : 0;
  const revUp = revDelta >= 0;

  return (
    <div className="p-6 md:p-8 max-w-[1200px] space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B2B1B]">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Overview of your instructor activity</p>
        </div>
        <button
          onClick={() => navigate('/instructor/courses/new')}
          className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#2E7D32] text-white text-sm font-bold rounded hover:bg-[#256329] transition-colors"
        >
          <Plus className="w-4 h-4" />
          New course
        </button>
      </div>

      {/* Alerts */}
      {unansweredQACount > 0 && (
        <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800 flex-1">
            <strong>{unansweredQACount}</strong> unanswered question{unansweredQACount !== 1 ? 's' : ''} from students
          </p>
          <Link
            to="/instructor/communication"
            className="text-xs font-bold text-amber-700 hover:text-amber-900 whitespace-nowrap"
          >
            Respond
          </Link>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total students"
          value={kpi.totalStudents.toLocaleString()}
          icon={<Users className="w-4 h-4" />}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <KPICard
          label="Monthly revenue"
          value={formatUGX(kpi.thisMonthRevenue)}
          icon={<Banknote className="w-4 h-4" />}
          iconBg="bg-green-50"
          iconColor="text-[#2E7D32]"
          trend={revDelta !== 0 ? { value: Math.abs(revDelta), up: revUp } : undefined}
        />
        <KPICard
          label="Average rating"
          value={kpi.averageRating > 0 ? `${kpi.averageRating.toFixed(1)} / 5.0` : '—'}
          icon={<Star className="w-4 h-4" />}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <KPICard
          label="Total reviews"
          value={kpi.totalReviews.toLocaleString()}
          icon={<MessageSquare className="w-4 h-4" />}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-[#1B2B1B]">Revenue overview</h2>
          <Link
            to="/instructor/analytics"
            className="text-xs font-medium text-[#2E7D32] hover:underline"
          >
            View details
          </Link>
        </div>
        {revenueChart.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={revenueChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: '#888' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#888' }}
                tickFormatter={(v) => formatCompact(v)}
                axisLine={false}
                tickLine={false}
                width={60}
              />
              <Tooltip
                formatter={(value: any, name: any) => [
                  formatUGX(value),
                  name === 'total' ? 'Total Revenue' : 'Net Earnings',
                ]}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
              />
              <Line
                type="monotone"
                dataKey="total"
                name="Total Revenue"
                stroke="#2E7D32"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="net"
                name="Net Earnings"
                stroke="#F57F17"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[260px] flex flex-col items-center justify-center text-gray-400">
            <TrendingUp className="w-8 h-8 mb-2" />
            <p className="text-sm">Revenue data will appear once you start earning</p>
          </div>
        )}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Top Courses - wider */}
        <div className="lg:col-span-3 bg-white rounded-lg border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-[#1B2B1B]">Your courses</h2>
            <Link
              to="/instructor/courses"
              className="text-xs font-medium text-[#2E7D32] hover:underline"
            >
              View all ({kpi.totalCourses})
            </Link>
          </div>
          {topCourses.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {topCourses.map((course) => (
                <Link
                  key={course.id}
                  to={`/instructor/course/${course.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-12 h-12 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                    {course.thumbnailPublicId ? (
                      <img
                        src={cloudinaryImageUrl(course.thumbnailPublicId, 96, 96)}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1B2B1B] truncate">{course.title}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {course.studentCount}
                      </span>
                      {course.averageRating > 0 && (
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-amber-500" /> {course.averageRating.toFixed(1)}
                        </span>
                      )}
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        course.status === 'PUBLISHED'
                          ? 'bg-green-50 text-[#2E7D32]'
                          : course.status === 'DRAFT'
                            ? 'bg-gray-100 text-gray-600'
                            : 'bg-amber-50 text-amber-700'
                      }`}>
                        {course.status === 'PENDING_REVIEW' ? 'In review' : course.status.toLowerCase()}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-5 py-12 text-center">
              <Sprout className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500 mb-3">No courses yet</p>
              <button
                onClick={() => navigate('/instructor/courses/new')}
                className="text-sm font-bold text-[#2E7D32] hover:underline"
              >
                Create your first course
              </button>
            </div>
          )}
        </div>

        {/* Recent Activity - narrower */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-[#1B2B1B]">Recent activity</h2>
          </div>
          {recentActivity.length > 0 ? (
            <div className="divide-y divide-gray-50 max-h-[380px] overflow-y-auto">
              {recentActivity.slice(0, 10).map((item, i) => (
                <div key={i} className="px-5 py-3">
                  <p className="text-sm text-[#1B2B1B]">
                    <span className="font-medium">{item.studentName}</span>{' '}
                    <span className="text-gray-500">enrolled in</span>{' '}
                    <span className="font-medium">{item.courseTitle}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {item.timeAgo}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-12 text-center">
              <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── KPI Card ──────────────────────────────────────────── */

function KPICard({
  label,
  value,
  icon,
  iconBg,
  iconColor,
  trend,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  trend?: { value: number; up: boolean };
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-7 h-7 rounded-md ${iconBg} ${iconColor} flex items-center justify-center`}>
          {icon}
        </div>
        <span className="text-xs text-gray-500 font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-[#1B2B1B]">{value}</p>
      {trend && (
        <p className={`text-xs mt-1 flex items-center gap-0.5 ${trend.up ? 'text-[#2E7D32]' : 'text-red-500'}`}>
          {trend.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trend.value.toFixed(0)}% vs last month
        </p>
      )}
    </div>
  );
}
