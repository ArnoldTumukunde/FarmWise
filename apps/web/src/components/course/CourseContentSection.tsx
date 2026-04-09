import { useState } from 'react';
import { ChevronDown, PlayCircle, Lock } from 'lucide-react';

interface Lecture {
  id: string;
  title: string;
  type: string;
  duration: number | null;
  isPreview: boolean;
}

interface Section {
  id: string;
  title: string;
  lectures: Lecture[];
}

interface CourseContentSectionProps {
  sections: Section[];
  totalDuration: number;
  onPreviewClick?: (lectureId: string) => void;
}

const formatTotalDuration = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const formatDuration = (s: number) =>
  `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export function CourseContentSection({
  sections,
  totalDuration,
  onPreviewClick,
}: CourseContentSectionProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    new Set(sections[0] ? [sections[0].id] : [])
  );
  const [allExpanded, setAllExpanded] = useState(false);

  const totalLectures = sections.reduce(
    (a, s) => a + s.lectures.length,
    0
  );

  const handleToggleAll = () => {
    if (allExpanded) {
      setExpandedIds(new Set());
      setAllExpanded(false);
    } else {
      setExpandedIds(new Set(sections.map((s) => s.id)));
      setAllExpanded(true);
    }
  };

  return (
    <section className="py-10 border-b border-gray-100">
      <h2 className="text-xl lg:text-2xl font-bold text-text-base mb-1">
        Course content
      </h2>
      <p className="text-sm text-text-muted mb-4">
        {sections.length} sections &middot; {totalLectures} lectures &middot;{' '}
        {formatTotalDuration(totalDuration)} total length
      </p>

      <button
        className="text-primary text-sm font-medium hover:underline underline-offset-2 mb-4 block"
        onClick={handleToggleAll}
      >
        {allExpanded ? 'Collapse all sections' : 'Expand all sections'}
      </button>

      <div>
        {sections.map((section) => {
          const isOpen = expandedIds.has(section.id);
          const sectionDuration = section.lectures.reduce(
            (a, l) => a + (l.duration || 0),
            0
          );

          return (
            <div
              key={section.id}
              className="border border-gray-200 rounded-none first:rounded-t-lg last:rounded-b-lg -mt-px"
            >
              {/* Section header */}
              <button
                className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100
                           transition-colors duration-150 text-left"
                onClick={() =>
                  setExpandedIds((prev) => {
                    const next = new Set(prev);
                    isOpen ? next.delete(section.id) : next.add(section.id);
                    return next;
                  })
                }
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <ChevronDown
                    size={18}
                    className={`flex-shrink-0 text-text-muted transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                  <span className="font-semibold text-text-base text-sm truncate">
                    {section.title}
                  </span>
                </div>
                <span className="text-xs text-text-muted flex-shrink-0 ml-4">
                  {section.lectures.length} lectures &middot;{' '}
                  {formatTotalDuration(sectionDuration)}
                </span>
              </button>

              {/* Lecture list */}
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  isOpen ? 'max-h-[2000px]' : 'max-h-0'
                }`}
              >
                {section.lectures.map((lecture) => (
                  <div
                    key={lecture.id}
                    className="flex items-center gap-3 px-5 py-3 border-t border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    {lecture.isPreview ? (
                      <PlayCircle
                        size={16}
                        className="text-primary flex-shrink-0"
                      />
                    ) : (
                      <Lock
                        size={14}
                        className="text-text-muted flex-shrink-0"
                      />
                    )}

                    {lecture.isPreview ? (
                      <button
                        className="text-sm text-primary hover:underline underline-offset-2 text-left flex-1"
                        onClick={() => onPreviewClick?.(lecture.id)}
                      >
                        {lecture.title}
                      </button>
                    ) : (
                      <span className="text-sm text-text-base flex-1">
                        {lecture.title}
                      </span>
                    )}

                    <span className="text-xs text-text-muted flex-shrink-0">
                      {lecture.duration
                        ? formatDuration(lecture.duration)
                        : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
