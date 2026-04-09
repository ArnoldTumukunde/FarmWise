import { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';

interface StickyBuyBarProps {
  courseTitle: string;
  price: number;
  averageRating: number;
  reviewCount: number;
  onAddToCart: () => void;
  purchaseCardRef: React.RefObject<HTMLDivElement | null>;
}

export function StickyBuyBar({
  courseTitle,
  price,
  averageRating,
  reviewCount,
  onAddToCart,
  purchaseCardRef,
}: StickyBuyBarProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-68px 0px 0px 0px' }
    );
    if (purchaseCardRef.current) observer.observe(purchaseCardRef.current);
    return () => observer.disconnect();
  }, [purchaseCardRef]);

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-40 bg-surface-dark border-b border-white/10
                   transition-transform duration-200 shadow-lg
                   ${visible ? 'translate-y-0' : '-translate-y-full'}`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center gap-6">
        {/* Title — hidden on mobile */}
        <p className="hidden md:block text-white font-semibold text-sm flex-1 truncate">
          {courseTitle}
        </p>
        {/* Rating */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-accent font-bold text-sm">
            {averageRating.toFixed(1)}
          </span>
          <div className="flex">
            {[1, 2, 3, 4, 5].map((i) => (
              <svg
                key={i}
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill={i <= Math.round(averageRating) ? '#F57F17' : 'none'}
                stroke="#F57F17"
                strokeWidth="2"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            ))}
          </div>
          <span className="text-white/40 text-xs hidden sm:inline">
            ({reviewCount.toLocaleString()})
          </span>
        </div>
        {/* Price + CTA */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-white font-bold text-lg">
            {price === 0 ? 'Free' : `UGX ${price.toLocaleString()}`}
          </span>
          <button
            onClick={onAddToCart}
            className="bg-primary hover:bg-primary-light text-white text-sm font-semibold
                       px-5 py-2.5 rounded transition-colors duration-150 flex items-center gap-2
                       active:scale-[0.98]"
          >
            <ShoppingCart size={15} />
            {price === 0 ? 'Enroll Free' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
}
