import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchApi } from '@/lib/api';
import { formatUGX } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Users,
  Banknote,
  Star,
  MessageSquare,
  Loader2,
  TrendingUp,
  BookOpen,
} from 'lucide-react';

interface AnalyticsData {
  totalEnrollments: number;
  totalRevenue: number;
  averageRating: number;
  reviewCount: number;
  courseTitle: string;
  enrollmentTrend: { date: string; count: number }[];
  lectureCompletionRates: { lectureId: string; title: string; completionRate: number }[];
}

export default function CourseAnalytics() {
  const { courseId } = useParams();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchApi(`/instructor/courses/${courseId}/analytics`)
      .then(res => setData(res.analytics))
      .catch((e: any) => setError(e.message || 'Failed to load analytics'))
      .finally(() => setLoading(false));
  }, [courseId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF5] flex items-center justify-center font-[Inter]">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-[#2E7D32] mx-auto mb-3" />
          <p className="text-[#5A6E5A] text-sm">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#FAFAF5] flex items-center justify-center font-[Inter]">
        <div className="text-center">
          <p className="text-red-500 font-medium mb-2">{error || 'Analytics not available'}</p>
          <Link
            to="/instructor"
            className="text-[#2E7D32] text-sm hover:underline"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const enrollmentTrend = data.enrollmentTrend || [];
  const lectureCompletionRates = data.lectureCompletionRates || [];

  const maxTrendCount = Math.max(...enrollmentTrend.map(d => d.count), 1);

  const statCards = [
    {
      label: 'Total Enrollments',
      value: data.totalEnrollments.toLocaleString(),
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Total Revenue',
      value: formatUGX(data.totalRevenue),
      icon: Banknote,
      color: 'text-[#2E7D32]',
      bg: 'bg-[#2E7D32]/5',
    },
    {
      label: 'Average Rating',
      value: data.averageRating > 0 ? data.averageRating.toFixed(1) : '--',
      icon: Star,
      color: 'text-[#F57F17]',
      bg: 'bg-amber-50',
    },
    {
      label: 'Reviews',
      value: data.reviewCount.toLocaleString(),
      icon: MessageSquare,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ];

  return (
    <div className="bg-[#FAFAF5] min-h-screen font-[Inter]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            to="/instructor"
            className="p-2 rounded-md hover:bg-gray-100 transition-colors focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={20} className="text-[#1B2B1B]" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-[#1B2B1B] truncate">
              Analytics: {data.courseTitle}
            </h1>
            <p className="text-sm text-[#5A6E5A]">Performance overview for the last 30 days</p>
          </div>
          <Button variant="outline" size="sm" asChild className="focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2">
            <Link to={`/instructor/course/${courseId}`}>Edit Course</Link>
          </Button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(stat => (
            <Card key={stat.label} className="border-gray-200 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-[#5A6E5A] text-sm mb-2">
                  <div className={`p-1.5 rounded-lg ${stat.bg}`}>
                    <stat.icon size={16} className={stat.color} />
                  </div>
                  {stat.label}
                </div>
                <div className="text-2xl font-bold text-[#1B2B1B]">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Enrollment Trend */}
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp size={18} className="text-[#2E7D32]" />
              <h2 className="text-base font-bold text-[#1B2B1B]">Enrollment Trend (Last 30 Days)</h2>
            </div>

            {enrollmentTrend.length === 0 ? (
              <p className="text-sm text-[#5A6E5A] text-center py-8">No enrollment data yet.</p>
            ) : (
              <div className="space-y-1">
                {enrollmentTrend.map(day => {
                  const pct = maxTrendCount > 0 ? (day.count / maxTrendCount) * 100 : 0;
                  return (
                    <div key={day.date} className="flex items-center gap-3 text-sm">
                      <span className="text-[#5A6E5A] w-20 shrink-0 text-xs">
                        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                        <div
                          className="h-full bg-[#2E7D32] rounded-full transition-all flex items-center justify-end pr-2"
                          style={{ width: `${Math.max(pct, 4)}%` }}
                        >
                          {day.count > 0 && (
                            <span className="text-[10px] font-bold text-white">{day.count}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lecture Completion Rates */}
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-6">
              <BookOpen size={18} className="text-[#F57F17]" />
              <h2 className="text-base font-bold text-[#1B2B1B]">Lecture Completion Rates</h2>
            </div>

            {lectureCompletionRates.length === 0 ? (
              <p className="text-sm text-[#5A6E5A] text-center py-8">No completion data yet.</p>
            ) : (
              <div className="space-y-3">
                {lectureCompletionRates.map(lec => (
                  <div key={lec.lectureId} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#1B2B1B] font-medium truncate mr-4">{lec.title}</span>
                      <span className="text-[#5A6E5A] shrink-0">{Math.round(lec.completionRate)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${lec.completionRate}%`,
                          backgroundColor: lec.completionRate >= 70 ? '#2E7D32' : lec.completionRate >= 40 ? '#F57F17' : '#ef4444',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
