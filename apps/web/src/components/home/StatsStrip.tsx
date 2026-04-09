import { useState, useEffect, useRef } from 'react';
import { Download, Users, BookOpen, GraduationCap } from 'lucide-react';
import { useInView } from '@/hooks/useInView';
import { anim } from '@/lib/animations';

interface StatsStripProps {
  stats: {
    farmerCount: number;
    courseCount: number;
    instructorCount: number;
  };
}

function useCountUp(target: number, isActive: boolean, duration = 1800) {
  const [current, setCurrent] = useState(0);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!isActive || hasRun.current) return;
    hasRun.current = true;

    const start = performance.now();
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [isActive, target, duration]);

  return current;
}

function formatStat(value: number): string {
  if (value >= 1000) return `${Math.floor(value / 1000)}k+`;
  return `${value}+`;
}

const statDefs = [
  { key: 'farmers', icon: Users, label: 'Farmers Learning' },
  { key: 'courses', icon: BookOpen, label: 'Courses' },
  { key: 'instructors', icon: GraduationCap, label: 'Instructors' },
];

export function StatsStrip({ stats }: StatsStripProps) {
  const { ref, isInView } = useInView({ threshold: 0.3 });

  const farmerCount = useCountUp(stats.farmerCount, isInView);
  const courseCount = useCountUp(stats.courseCount, isInView);
  const instructorCount = useCountUp(stats.instructorCount, isInView);

  const values = [farmerCount, courseCount, instructorCount];

  return (
    <section ref={ref} className="bg-[#2E7D32]">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-12 px-4 max-w-7xl mx-auto text-center">
        {statDefs.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={stat.key} style={anim.rainDrop(isInView, i * 100)}>
              <div className="flex items-center justify-center gap-2 mb-1">
                <Icon className="h-6 w-6 text-green-200" />
              </div>
              <p className="text-4xl font-bold text-white">
                {formatStat(values[i])}
              </p>
              <p className="text-sm text-green-100 mt-1">{stat.label}</p>
            </div>
          );
        })}

        {/* Offline stat */}
        <div
          className="flex flex-col items-center"
          style={anim.rainDrop(isInView, 300)}
        >
          <Download className="h-8 w-8 text-white mb-1" />
          <p className="text-4xl font-bold text-white">Offline</p>
          <p className="text-sm text-green-100 mt-1">
            Download &amp; learn anywhere, no internet needed
          </p>
        </div>
      </div>
    </section>
  );
}
