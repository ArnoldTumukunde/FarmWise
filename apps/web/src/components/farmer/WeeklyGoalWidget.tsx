import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { Flame, Info } from 'lucide-react';

interface WeeklyProgress {
  currentStreakDays: number;
  minutesTodayWatched: number;
  dailyGoalMinutes: number;
  daysThisWeekActive: number;
  weeklyGoalDays: number;
  weekStartDate: string;
  weekEndDate: string;
}

function CircularProgress({ pct }: { pct: number }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <svg width="72" height="72" viewBox="0 0 72 72" className="-rotate-90">
      <circle cx="36" cy="36" r={radius} fill="none"
        stroke="#E5E7EB" strokeWidth="6" />
      <circle cx="36" cy="36" r={radius} fill="none"
        stroke="#2E7D32" strokeWidth="6"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
    </svg>
  );
}

const formatWeekRange = (start: string, end: string) => {
  const s = new Date(start);
  const e = new Date(end);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  if (s.getMonth() === e.getMonth()) {
    return `${months[s.getMonth()]} ${s.getDate()} - ${e.getDate()}`;
  }
  return `${months[s.getMonth()]} ${s.getDate()} - ${months[e.getMonth()]} ${e.getDate()}`;
};

export function WeeklyGoalWidget() {
  const [data, setData] = useState<WeeklyProgress | null>(null);

  useEffect(() => {
    fetchApi('/farmer/weekly-progress')
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) return null;

  const pct = Math.min(100, (data.minutesTodayWatched / data.dailyGoalMinutes) * 100);
  const flameColor = data.currentStreakDays === 0 ? 'text-gray-300' : 'text-accent';
  const flamePulse = data.currentStreakDays >= 7 ? 'animate-pulse' : '';

  return (
    <div className="bg-white border border-gray-200 rounded-xl mx-4 md:mx-6 lg:mx-10 my-5">
      <div className="flex items-center gap-6 px-6 py-5 flex-wrap md:flex-nowrap">
        {/* Left */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Flame size={24} className={`${flameColor} ${flamePulse}`} />
            <span className="text-lg font-bold text-text-base">Build a learning habit</span>
          </div>
          <p className="text-sm text-text-muted mt-1">
            Learn a little each day. Farmers who study regularly get better results from their courses.
          </p>
        </div>

        {/* Centre — streak */}
        <div className="flex-shrink-0 text-center px-4">
          <Flame size={28} className={`mx-auto ${flameColor} ${flamePulse}`} />
          <p className="text-2xl font-bold text-text-base mt-1">{data.currentStreakDays} day{data.currentStreakDays !== 1 ? 's' : ''}</p>
          <p className="text-xs text-text-muted mt-1">Current streak</p>
        </div>

        {/* Right — circular ring + stats */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <CircularProgress pct={pct} />
          <div className="space-y-1">
            <p className="flex items-center gap-1.5 text-xs text-text-muted">
              <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
              {data.minutesTodayWatched}/{data.dailyGoalMinutes} course min
            </p>
            <p className="flex items-center gap-1.5 text-xs text-text-muted">
              <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
              {data.daysThisWeekActive}/{data.weeklyGoalDays} {data.daysThisWeekActive === 1 ? 'day' : 'days'}
            </p>
            <p className="text-[11px] text-text-muted mt-1">
              {formatWeekRange(data.weekStartDate, data.weekEndDate)}
            </p>
          </div>
        </div>

        {/* Info icon */}
        <div className="flex-shrink-0" title="Weekly goals reset every Monday">
          <Info size={18} className="text-text-muted" />
        </div>
      </div>
    </div>
  );
}
