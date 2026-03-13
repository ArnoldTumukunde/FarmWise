import { useState, useEffect, useRef, useCallback } from 'react';
import { Download } from 'lucide-react';

interface StatsStripProps {
  stats: {
    farmerCount: number;
    courseCount: number;
    instructorCount: number;
  };
}

function useCountUp(target: number, isVisible: boolean, duration = 2000) {
  const [value, setValue] = useState(0);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!isVisible || hasRun.current) return;
    hasRun.current = true;

    const start = performance.now();
    let rafId: number;

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      setValue(Math.round(eased * target));

      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isVisible, target, duration]);

  return value;
}

export function StatsStrip({ stats }: StatsStripProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  const handleIntersect = useCallback((entries: IntersectionObserverEntry[]) => {
    if (entries[0]?.isIntersecting) {
      setIsVisible(true);
    }
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(handleIntersect, {
      threshold: 0.3,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleIntersect]);

  const farmerCount = useCountUp(stats.farmerCount, isVisible);
  const courseCount = useCountUp(stats.courseCount, isVisible);
  const instructorCount = useCountUp(stats.instructorCount, isVisible);

  return (
    <section ref={ref} className="bg-[#2E7D32]">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-12 px-4 max-w-7xl mx-auto text-center">
        <div>
          <p className="text-4xl font-bold text-white">
            {farmerCount.toLocaleString()}+
          </p>
          <p className="text-sm text-green-100 mt-1">Farmers Learning</p>
        </div>

        <div>
          <p className="text-4xl font-bold text-white">
            {courseCount.toLocaleString()}+
          </p>
          <p className="text-sm text-green-100 mt-1">Courses</p>
        </div>

        <div>
          <p className="text-4xl font-bold text-white">
            {instructorCount.toLocaleString()}+
          </p>
          <p className="text-sm text-green-100 mt-1">Instructors</p>
        </div>

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2">
            <Download className="h-8 w-8 text-white" />
            <p className="text-4xl font-bold text-white">Offline</p>
          </div>
          <p className="text-sm text-green-100 mt-1">
            Download &amp; learn anywhere, no internet needed
          </p>
        </div>
      </div>
    </section>
  );
}
