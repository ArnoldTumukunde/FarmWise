import { useState, useEffect } from 'react';
import { fetchApi } from '../../lib/api';
import {
  DollarSign,
  TrendingUp,
  Users,
  BookOpen,
  Wallet,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const formatUGX = (amount: number) =>
  new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(amount);

const formatCompact = (amount: number) => {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
  return amount.toString();
};

/* ── Skeleton ─────────────────────────────────────────── */

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-6 animate-pulse">
      <div className="space-y-3">
        <div className="h-3 w-24 bg-[#2E7D32]/10 rounded" />
        <div className="h-8 w-32 bg-[#2E7D32]/10 rounded" />
      </div>
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-6 animate-pulse">
      <div className="h-5 w-40 bg-[#2E7D32]/10 rounded mb-6" />
      <div className="h-72 w-full bg-[#2E7D32]/10 rounded" />
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-6 animate-pulse space-y-3">
      <div className="h-5 w-48 bg-[#2E7D32]/10 rounded" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-10 w-full bg-[#2E7D32]/10 rounded" />
      ))}
    </div>
  );
}

/* ── KPI config ───────────────────────────────────────── */

const kpiConfig = [
  { key: 'grossRevenue', title: 'Gross Revenue', icon: DollarSign, bg: 'bg-emerald-50', text: 'text-emerald-600' },
  { key: 'netRevenue', title: 'Net Revenue', icon: TrendingUp, bg: 'bg-green-50', text: 'text-[#2E7D32]' },
  { key: 'platformEarnings', title: 'Platform Earnings (30%)', icon: Wallet, bg: 'bg-blue-50', text: 'text-blue-600' },
  { key: 'instructorPayouts', title: 'Instructor Payouts (70%)', icon: Users, bg: 'bg-purple-50', text: 'text-purple-600' },
  { key: 'pendingPayouts', title: 'Pending Payouts', icon: DollarSign, bg: 'bg-amber-50', text: 'text-amber-600' },
];

/* ── Main component ───────────────────────────────────── */

export function RevenueLayout() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApi('/admin/revenue')
      .then((res) => setData(res))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <span className="text-red-500 text-2xl">!</span>
        </div>
        <p className="text-[#1B2B1B] font-semibold mb-1">Failed to load revenue data</p>
        <p className="text-sm text-[#5A6E5A]">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1B2B1B]">Revenue Analytics</h1>
        <p className="text-sm text-[#5A6E5A] mt-1">Platform revenue breakdown and financial insights</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
          : kpiConfig.map((kpi) => {
              const Icon = kpi.icon;
              const value = Number(data?.[kpi.key] || 0);
              return (
                <div
                  key={kpi.key}
                  className="bg-white rounded-xl border border-[#2E7D32]/10 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-[#5A6E5A] mb-2">{kpi.title}</p>
                      <p className="text-xl font-bold text-[#1B2B1B]">{formatUGX(value)}</p>
                    </div>
                    <div className={`w-10 h-10 rounded-full ${kpi.bg} ${kpi.text} flex items-center justify-center flex-shrink-0`}>
                      <Icon size={18} />
                    </div>
                  </div>
                </div>
              );
            })}
      </div>

      {/* Revenue by month chart */}
      {loading ? (
        <SkeletonChart />
      ) : (
        <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-6">
          <h2 className="text-lg font-semibold text-[#1B2B1B] mb-6">Revenue by Month</h2>
          {data?.monthlyRevenue?.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={data.monthlyRevenue} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2E7D32" strokeOpacity={0.1} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#5A6E5A' }} />
                <YAxis tick={{ fontSize: 12, fill: '#5A6E5A' }} tickFormatter={formatCompact} />
                <Tooltip
                  formatter={(value: any) => formatUGX(Number(value))}
                  contentStyle={{
                    borderRadius: '0.75rem',
                    border: '1px solid rgba(46,125,50,0.1)',
                    fontSize: '0.875rem',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '0.875rem' }} />
                <Bar dataKey="gross" name="Gross Revenue" fill="#2E7D32" radius={[4, 4, 0, 0]} stackId="a" />
                <Bar dataKey="platform" name="Platform (30%)" fill="#F57F17" radius={[4, 4, 0, 0]} stackId="b" />
                <Bar dataKey="instructor" name="Instructor (70%)" fill="#1565C0" radius={[4, 4, 0, 0]} stackId="b" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-72 flex items-center justify-center">
              <p className="text-sm text-[#5A6E5A]">No revenue data available yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Two-column: Top Instructors + Top Courses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Earning Instructors */}
        {loading ? (
          <SkeletonTable />
        ) : (
          <div className="bg-white rounded-xl border border-[#2E7D32]/10">
            <div className="px-6 py-4 border-b border-[#2E7D32]/10">
              <h2 className="text-lg font-semibold text-[#1B2B1B] flex items-center gap-2">
                <Users size={18} className="text-[#2E7D32]" />
                Top Earning Instructors
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[#5A6E5A] border-b border-[#2E7D32]/5">
                    <th className="px-6 py-3 font-medium">#</th>
                    <th className="px-6 py-3 font-medium">Instructor</th>
                    <th className="px-6 py-3 font-medium text-right">Earnings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2E7D32]/5">
                  {data?.topInstructors?.length > 0 ? (
                    data.topInstructors.map((inst: any, idx: number) => (
                      <tr key={inst.id || idx} className="hover:bg-[#FAFAF5]/50 transition-colors">
                        <td className="px-6 py-3 text-[#5A6E5A] font-medium">{idx + 1}</td>
                        <td className="px-6 py-3 font-medium text-[#1B2B1B]">
                          {inst.displayName || inst.name || inst.email || 'Unknown'}
                        </td>
                        <td className="px-6 py-3 text-right font-semibold text-[#1B2B1B]">
                          {formatUGX(Number(inst.earnings || inst.totalEarnings || 0))}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-10 text-center text-[#5A6E5A]">No data available.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Top Earning Courses */}
        {loading ? (
          <SkeletonTable />
        ) : (
          <div className="bg-white rounded-xl border border-[#2E7D32]/10">
            <div className="px-6 py-4 border-b border-[#2E7D32]/10">
              <h2 className="text-lg font-semibold text-[#1B2B1B] flex items-center gap-2">
                <BookOpen size={18} className="text-[#2E7D32]" />
                Top Earning Courses
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[#5A6E5A] border-b border-[#2E7D32]/5">
                    <th className="px-6 py-3 font-medium">#</th>
                    <th className="px-6 py-3 font-medium">Course</th>
                    <th className="px-6 py-3 font-medium text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2E7D32]/5">
                  {data?.topCourses?.length > 0 ? (
                    data.topCourses.map((course: any, idx: number) => (
                      <tr key={course.id || idx} className="hover:bg-[#FAFAF5]/50 transition-colors">
                        <td className="px-6 py-3 text-[#5A6E5A] font-medium">{idx + 1}</td>
                        <td className="px-6 py-3 font-medium text-[#1B2B1B] max-w-[200px] truncate">
                          {course.title || 'Unknown Course'}
                        </td>
                        <td className="px-6 py-3 text-right font-semibold text-[#1B2B1B]">
                          {formatUGX(Number(course.revenue || course.totalRevenue || 0))}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-10 text-center text-[#5A6E5A]">No data available.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
