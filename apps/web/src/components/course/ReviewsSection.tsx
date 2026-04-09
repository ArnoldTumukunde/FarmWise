import { useState } from 'react';

interface Review {
  id: string;
  rating: number;
  content: string;
  createdAt: string;
  user?: {
    profile?: {
      displayName?: string;
    };
  };
  instructorResponse?: string;
}

interface ReviewsSectionProps {
  reviews: Review[];
  averageRating: number;
  reviewCount: number;
}

function StarBreakdownBars({
  distribution,
}: {
  distribution: Record<string, number>;
}) {
  return (
    <div className="space-y-2">
      {[5, 4, 3, 2, 1].map((star) => {
        const pct = distribution[String(star)] ?? 0;
        return (
          <div key={star} className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex items-center gap-1 w-20 flex-shrink-0">
              {[1, 2, 3, 4, 5].map((i) => (
                <svg
                  key={i}
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill={i <= star ? '#F57F17' : 'none'}
                  stroke="#F57F17"
                  strokeWidth="2"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ))}
            </div>
            <span className="text-xs text-text-muted w-8 text-right flex-shrink-0">
              {pct}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const [expanded, setExpanded] = useState(false);
  const body = review.content || '';
  const isLong = body.length > 280;
  const authorName =
    review.user?.profile?.displayName || 'Student';

  return (
    <div className="border-b border-gray-100 pb-6 last:border-0">
      {/* Author row */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center
                      text-primary font-semibold text-sm flex-shrink-0"
        >
          {authorName[0].toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-semibold text-text-base leading-none">
            {authorName}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((i) => (
                <svg
                  key={i}
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill={i <= review.rating ? '#F57F17' : 'none'}
                  stroke="#F57F17"
                  strokeWidth="2"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ))}
            </div>
            <span className="text-xs text-text-muted">
              {new Date(review.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
      {/* Body */}
      {body && (
        <p
          className={`text-sm text-text-base leading-relaxed ${
            !expanded && isLong ? 'line-clamp-3' : ''
          }`}
        >
          {body}
        </p>
      )}
      {isLong && (
        <button
          onClick={() => setExpanded((p) => !p)}
          className="text-primary text-xs font-semibold mt-1.5 hover:underline underline-offset-2"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
      {/* Instructor response */}
      {review.instructorResponse && (
        <div className="mt-3 bg-surface p-4 rounded-lg border border-gray-100">
          <div className="text-xs font-bold text-primary mb-1">
            Instructor Response
          </div>
          <p className="text-sm text-text-base/70">
            {review.instructorResponse}
          </p>
        </div>
      )}
    </div>
  );
}

export function ReviewsSection({
  reviews,
  averageRating,
  reviewCount,
}: ReviewsSectionProps) {
  const [visibleCount, setVisibleCount] = useState(4);
  const visibleReviews = reviews.slice(0, visibleCount);

  // Compute rating distribution client-side
  const distribution = ['1', '2', '3', '4', '5'].reduce(
    (acc, star) => {
      const count = reviews.filter(
        (r) => Math.round(r.rating) === Number(star)
      ).length;
      acc[star] =
        reviews.length > 0
          ? Math.round((count / reviews.length) * 100)
          : 0;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <section className="py-10 border-b border-gray-100" id="reviews">
      <h2 className="text-xl lg:text-2xl font-bold text-text-base mb-6">
        Student reviews
      </h2>

      {/* Aggregate */}
      <div className="flex items-start gap-8 mb-8">
        {/* Big number */}
        <div className="text-center flex-shrink-0">
          <div className="text-6xl font-bold text-text-base leading-none">
            {Number(averageRating).toFixed(1)}
          </div>
          <div className="flex justify-center mt-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <svg
                key={i}
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill={
                  i <= Math.round(averageRating) ? '#F57F17' : 'none'
                }
                stroke="#F57F17"
                strokeWidth="2"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            ))}
          </div>
          <div className="text-xs text-text-muted mt-1">
            {reviewCount} {reviewCount === 1 ? 'rating' : 'ratings'}
          </div>
        </div>
        {/* Bars */}
        <div className="flex-1">
          <StarBreakdownBars distribution={distribution} />
        </div>
      </div>

      {/* Individual review cards */}
      {visibleReviews.length > 0 ? (
        <div className="space-y-6">
          {visibleReviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-text-muted">
          No reviews yet. Be the first to review!
        </div>
      )}

      {/* Load more */}
      {visibleCount < reviews.length && (
        <button
          onClick={() => setVisibleCount((p) => p + 4)}
          className="mt-6 w-full py-3 border-2 border-primary text-primary font-semibold
                     rounded-lg hover:bg-primary hover:text-white transition-all duration-150
                     text-sm active:scale-[0.99]"
        >
          Show more reviews
        </button>
      )}
    </section>
  );
}
