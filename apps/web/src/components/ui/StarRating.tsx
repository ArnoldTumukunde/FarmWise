import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  size?: number;
  showNumber?: boolean;
  reviewCount?: number;
}

export function StarRating({ rating, size = 14, showNumber = false, reviewCount }: StarRatingProps) {
  const stars = [1, 2, 3, 4, 5].map((i) => {
    if (rating >= i) return 'full';
    if (rating >= i - 0.5) return 'half';
    return 'empty';
  });

  return (
    <div className="flex items-center gap-1" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {showNumber && (
        <span className="text-sm font-bold text-accent mr-0.5">{rating.toFixed(1)}</span>
      )}
      <div className="flex items-center gap-0.5">
        {stars.map((type, i) => (
          <span
            key={i}
            style={{ position: 'relative', display: 'inline-block', width: size, height: size }}
          >
            <Star size={size} className="text-gray-300" fill="none" strokeWidth={1.5} />
            {type === 'full' && (
              <Star
                size={size}
                style={{ position: 'absolute', top: 0, left: 0 }}
                fill="#F57F17"
                stroke="#F57F17"
                strokeWidth={0}
              />
            )}
            {type === 'half' && (
              <span
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '50%',
                  overflow: 'hidden',
                  display: 'inline-block',
                }}
              >
                <Star size={size} fill="#F57F17" stroke="#F57F17" strokeWidth={0} />
              </span>
            )}
          </span>
        ))}
      </div>
      {reviewCount !== undefined && (
        <span className="text-xs text-text-muted ml-0.5">
          ({reviewCount.toLocaleString()})
        </span>
      )}
    </div>
  );
}
