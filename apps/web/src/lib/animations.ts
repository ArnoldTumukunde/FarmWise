import type { CSSProperties } from 'react';

/**
 * Inline animation styles — bypasses Tailwind CSS class generation entirely.
 * Keyframes are defined in index.css (unlayered, globally available).
 */

const HIDDEN: CSSProperties = { opacity: 0 };

export const anim = {
  soilRise: (active: boolean, delay = 0): CSSProperties =>
    active
      ? { animation: 'soilRise 0.6s ease-out both', animationDelay: `${delay}ms` }
      : HIDDEN,

  rainDrop: (active: boolean, delay = 0): CSSProperties =>
    active
      ? { animation: 'rainDrop 0.5s ease-out both', animationDelay: `${delay}ms` }
      : HIDDEN,

  seedGrow: (active: boolean, delay = 0): CSSProperties =>
    active
      ? { animation: 'seedGrow 0.7s cubic-bezier(0.34,1.56,0.64,1) both', animationDelay: `${delay}ms`, transformOrigin: 'bottom center' }
      : HIDDEN,

  fieldRow: (active: boolean, delay = 0): CSSProperties =>
    active
      ? { animation: 'fieldRow 0.8s ease-out both', animationDelay: `${delay}ms`, transformOrigin: 'left' }
      : { opacity: 0, transform: 'scaleX(0)' },

  sproutUp: (active: boolean, delay = 0): CSSProperties =>
    active
      ? { animation: 'sproutUp 0.6s cubic-bezier(0.34,1.56,0.64,1) both', animationDelay: `${delay}ms`, transformOrigin: 'bottom center' }
      : { opacity: 0, transform: 'scaleY(0)' },

  harvestReveal: (active: boolean, delay = 0): CSSProperties =>
    active
      ? { animation: 'harvestReveal 0.9s ease-out both', animationDelay: `${delay}ms` }
      : HIDDEN,

  leafSway: (active: boolean): CSSProperties =>
    active
      ? { animation: 'leafSway 3s ease-in-out infinite' }
      : {},

  heroCard: (active: boolean, delay = 0): CSSProperties =>
    active
      ? { animation: 'heroCardSlide 0.6s ease-out both', animationDelay: `${delay}ms` }
      : HIDDEN,

  countCrop: (active: boolean, delay = 0): CSSProperties =>
    active
      ? { animation: `countCrop 0.3s ease-out ${delay}ms both` }
      : { transform: 'translateY(100%)' },
};
