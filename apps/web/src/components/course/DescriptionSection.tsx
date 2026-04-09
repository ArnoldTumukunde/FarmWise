import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export function DescriptionSection({
  description,
}: {
  description: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLong = description.length > 500;

  return (
    <section className="py-10 border-b border-gray-100">
      <h2 className="text-xl lg:text-2xl font-bold text-text-base mb-5">
        Description
      </h2>
      <div className="relative">
        <div
          className={`prose prose-sm max-w-none text-text-base
                      ${!expanded && isLong ? 'max-h-48 overflow-hidden' : ''}`}
          dangerouslySetInnerHTML={{ __html: description }}
        />
        {!expanded && isLong && (
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent pointer-events-none" />
        )}
      </div>
      {isLong && (
        <button
          onClick={() => setExpanded((p) => !p)}
          className="mt-3 flex items-center gap-1.5 text-primary font-semibold text-sm
                     hover:underline underline-offset-2 transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp size={16} /> Show less
            </>
          ) : (
            <>
              <ChevronDown size={16} /> Show more
            </>
          )}
        </button>
      )}
    </section>
  );
}
