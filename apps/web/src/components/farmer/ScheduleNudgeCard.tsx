import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlarmClock } from 'lucide-react';

const DISMISSED_KEY = 'farmwise-schedule-nudge-dismissed';

export function ScheduleNudgeCard() {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISSED_KEY) === 'true'
  );
  const [animateOut, setAnimateOut] = useState(false);

  if (dismissed) return null;

  const handleDismiss = () => {
    setAnimateOut(true);
    setTimeout(() => {
      localStorage.setItem(DISMISSED_KEY, 'true');
      setDismissed(true);
    }, 200);
  };

  return (
    <div
      className={`bg-white border border-gray-200 rounded-xl mx-4 md:mx-6 lg:mx-10 mb-5
        transition-all duration-200 ${animateOut ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
    >
      <div className="flex items-start gap-4 px-6 py-5">
        <AlarmClock size={22} className="text-text-muted flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-base font-semibold text-text-base">
            Schedule your learning time
          </p>
          <p className="text-sm text-text-muted mt-1 leading-relaxed">
            Research shows farmers who set a regular learning schedule are 3× more likely
            to complete their courses. Download your lectures beforehand so you can learn
            even without internet in the field.
          </p>
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={() => navigate('/profile?tab=learning')}
              className="border border-primary text-primary text-sm font-semibold px-5 py-2 rounded-lg hover:bg-primary/5 transition-colors"
            >
              Get started
            </button>
            <button
              onClick={handleDismiss}
              className="text-sm text-text-muted hover:text-text-base transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
