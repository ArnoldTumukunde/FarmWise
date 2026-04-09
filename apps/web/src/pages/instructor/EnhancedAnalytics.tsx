import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Users,
  TrendingUp,
  TrendingDown,
  Award,
  Loader2,
  BarChart3,
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';

const formatUGX = (amount: number) =>
  new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    maximumFractionDigits: 0,
  }).format(amount);

const FUNNEL_COLORS = ['#2E7D32', '#43A047', '#66BB6A', '#81C784', '#A5D6A7'];
const AMBER_FLAG = '#F57F17';

interface CourseOption {
  id: string;
  title: string;
}

interface OverviewData {
  totalStudents: number;
  totalRevenue: number;
  revenueDelta: number;
  bestCourse: string;
}

interface EnrollmentPoint {
  date: string;
  count: number;
}

interface FunnelStep {
  name: string;
  value: number;
}

interface LectureWatchTime {
  title: string;
  watchPercent: number;
}

interface MonthlyRevenue {
  month: string;
  revenue: number;
}

type ActiveTab = 'overview' | 'revenue';

function SkeletonCharts() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-[#2E7D32]/10 p-5">
            <div className="h-4 w-20 bg-gray-200 rounded" />
            <div className="h-8 w-16 bg-gray-200 rounded mt-2" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-6">
        <div className="h-5 w-40 bg-gray-200 rounded mb-4" />
        <div className="h-64 bg-gray-100 rounded" />
      </div>
    </div>
  );
}

export default function EnhancedAnalytics() {
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  const [overview, setOverview] = useState<OverviewData>({
    totalStudents: 0,
    totalRevenue: 0,
    revenueDelta: 0,
    bestCourse: '',
  });
  const [enrollments, setEnrollments] = useState<EnrollmentPoint[]>([]);
  const [funnel, setFunnel] = useState<FunnelStep[]>([]);
  const [lectureWatch, setLectureWatch] = useState<LectureWatchTime[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([]);

  // Load courses list
  useEffect(() => {
    fetchApi('/instructor/courses')
      .then((res) => {
        const cs = res.courses || res.data || res || [];
        setCourses(cs.map((c: any) => ({ id: c.id, title: c.title })));
      })
      .catch(() => {});
  }, []);

  // Load analytics data
  useEffect(() => {
    setLoading(true);
    const courseParam = selectedCourseId !== 'all' ? `?courseId=${selectedCourseId}` : '';

    Promise.all([
      fetchApi(`/instructor/analytics/overview${courseParam}`).catch(() => ({
        totalStudents: 0,
        totalRevenue: 0,
        revenueDelta: 0,
        bestCourse: '',
      })),
      fetchApi(`/instructor/analytics/enrollments${courseParam}`).catch(() => ({
        enrollments: [],
      })),
      fetchApi(`/instructor/analytics/funnel${courseParam}`).catch(() => ({ funnel: [] })),
      fetchApi(`/instructor/analytics/lecture-watch${courseParam}`).catch(() => ({
        lectures: [],
      })),
      fetchApi(`/instructor/analytics/revenue${courseParam}`).catch(() => ({
        monthly: [],
      })),
    ])
      .then(([overviewRes, enrollRes, funnelRes, watchRes, revenueRes]) => {
        setOverview({
          totalStudents: overviewRes.totalStudents || 0,
          totalRevenue: overviewRes.totalRevenue || 0,
          revenueDelta: overviewRes.revenueDelta || 0,
          bestCourse: overviewRes.bestCourse || 'N/A',
        });
        setEnrollments(enrollRes.enrollments || enrollRes.data || []);
        setFunnel(
          funnelRes.funnel ||
            funnelRes.data || [
              { name: 'Started', value: 0 },
              { name: '25%', value: 0 },
              { name: '50%', value: 0 },
              { name: '75%', value: 0 },
              { name: 'Completed', value: 0 },
            ]
        );
        setLectureWatch(watchRes.lectures || watchRes.data || []);
        setMonthlyRevenue(revenueRes.monthly || revenueRes.data || []);
      })
      .finally(() => setLoading(false));
  }, [selectedCourseId]);

  return (
    <div className="bg-[#FAFAF5] min-h-screen p-4 md:p-8 font-[Inter]">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1B2B1B]">Analytics</h1>
            <p className="text-[#5A6E5A] text-sm mt-1">
              Track your performance and student engagement
            </p>
          </div>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="rounded-md border border-[#2E7D32]/10 px-3 py-2 text-sm bg-white text-[#1B2B1B] focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/20 w-full sm:w-64"
          >
            <option value="all">All Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-lg border border-[#2E7D32]/10 p-1 w-fit">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-1.5 text-sm rounded-md transition-colors flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'bg-[#2E7D32] text-white'
                : 'text-[#5A6E5A] hover:bg-gray-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('revenue')}
            className={`px-4 py-1.5 text-sm rounded-md transition-colors flex items-center gap-2 ${
              activeTab === 'revenue'
                ? 'bg-[#2E7D32] text-white'
                : 'text-[#5A6E5A] hover:bg-gray-100'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Revenue
          </button>
        </div>

        {loading ? (
          <SkeletonCharts />
        ) : activeTab === 'overview' ? (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-5">
                <div className="flex items-center gap-2 text-[#5A6E5A] text-sm mb-1">
                  <Users className="w-4 h-4" />
                  Total Students
                </div>
                <p className="text-2xl font-bold text-[#1B2B1B]">
                  {overview.totalStudents.toLocaleString()}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-5">
                <div className="flex items-center gap-2 text-[#5A6E5A] text-sm mb-1">
                  <DollarSign className="w-4 h-4" />
                  Total Revenue
                </div>
                <p className="text-2xl font-bold text-[#1B2B1B]">
                  {formatUGX(overview.totalRevenue)}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-5">
                <div className="flex items-center gap-2 text-[#5A6E5A] text-sm mb-1">
                  {overview.revenueDelta >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-[#2E7D32]" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  vs Last Month
                </div>
                <p
                  className={`text-2xl font-bold ${
                    overview.revenueDelta >= 0 ? 'text-[#2E7D32]' : 'text-red-500'
                  }`}
                >
                  {overview.revenueDelta >= 0 ? '+' : ''}
                  {formatUGX(overview.revenueDelta)}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-5">
                <div className="flex items-center gap-2 text-[#5A6E5A] text-sm mb-1">
                  <Award className="w-4 h-4" />
                  Best Course
                </div>
                <p className="text-sm font-semibold text-[#1B2B1B] line-clamp-2">
                  {overview.bestCourse}
                </p>
              </div>
            </div>

            {/* Enrollment Over Time */}
            {enrollments.length > 0 && (
              <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-6">
                <h3 className="text-lg font-semibold text-[#1B2B1B] mb-4">
                  Enrollment Over Time (Last 90 Days)
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={enrollments}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#5A6E5A' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#5A6E5A' }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: '1px solid #e5e7eb',
                        fontSize: 13,
                      }}
                    />
                    <Bar dataKey="count" fill="#2E7D32" radius={[4, 4, 0, 0]} name="Enrollments" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Completion Funnel */}
            {funnel.length > 0 && (
              <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-6">
                <h3 className="text-lg font-semibold text-[#1B2B1B] mb-4">Completion Funnel</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={funnel} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" tick={{ fontSize: 12, fill: '#5A6E5A' }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 12, fill: '#5A6E5A' }}
                      width={80}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: '1px solid #e5e7eb',
                        fontSize: 13,
                      }}
                    />
                    <Bar dataKey="value" name="Students" radius={[0, 4, 4, 0]}>
                      {funnel.map((_, index) => (
                        <Cell key={index} fill={FUNNEL_COLORS[index % FUNNEL_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Per-Lecture Watch Time */}
            {lectureWatch.length > 0 && (
              <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-6">
                <h3 className="text-lg font-semibold text-[#1B2B1B] mb-4">
                  Per-Lecture Watch Time
                </h3>
                <ResponsiveContainer width="100%" height={Math.max(300, lectureWatch.length * 40)}>
                  <BarChart data={lectureWatch} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      tick={{ fontSize: 12, fill: '#5A6E5A' }}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <YAxis
                      type="category"
                      dataKey="title"
                      tick={{ fontSize: 11, fill: '#5A6E5A' }}
                      width={150}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: '1px solid #e5e7eb',
                        fontSize: 13,
                      }}
                      formatter={(value: number) => [`${value}%`, 'Watch Rate']}
                    />
                    <Bar dataKey="watchPercent" name="Watch %" radius={[0, 4, 4, 0]}>
                      {lectureWatch.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={entry.watchPercent < 40 ? AMBER_FLAG : '#2E7D32'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-xs text-[#5A6E5A] mt-2">
                  Lectures below 40% watch rate are flagged in amber.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Revenue Tab */
          <div className="space-y-6">
            {/* Revenue KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-5">
                <p className="text-sm text-[#5A6E5A] mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-[#1B2B1B]">
                  {formatUGX(overview.totalRevenue)}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-5">
                <p className="text-sm text-[#5A6E5A] mb-1">Platform Fees (30%)</p>
                <p className="text-2xl font-bold text-[#5A6E5A]">
                  {formatUGX(overview.totalRevenue * 0.3)}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-5">
                <p className="text-sm text-[#5A6E5A] mb-1">Your Earnings (70%)</p>
                <p className="text-2xl font-bold text-[#2E7D32]">
                  {formatUGX(overview.totalRevenue * 0.7)}
                </p>
              </div>
            </div>

            {/* Monthly Revenue Chart */}
            {monthlyRevenue.length > 0 ? (
              <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-6">
                <h3 className="text-lg font-semibold text-[#1B2B1B] mb-4">
                  Monthly Revenue (Last 12 Months)
                </h3>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#5A6E5A' }} />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#5A6E5A' }}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: '1px solid #e5e7eb',
                        fontSize: 13,
                      }}
                      formatter={(value: number) => [formatUGX(value), 'Revenue']}
                    />
                    <Legend />
                    <Bar dataKey="revenue" fill="#2E7D32" radius={[4, 4, 0, 0]} name="Revenue (UGX)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-12 text-center">
                <DollarSign className="w-12 h-12 text-[#5A6E5A] mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-[#1B2B1B] mb-2">No revenue data yet</h3>
                <p className="text-[#5A6E5A]">
                  Revenue charts will appear once you start earning.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
