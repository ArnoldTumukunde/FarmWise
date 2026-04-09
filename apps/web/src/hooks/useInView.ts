import { useCallback, useRef, useState } from 'react';

/**
 * Scroll-triggered visibility hook using a callback ref.
 * Fires once when the element enters the viewport (threshold default 15%).
 *
 * Usage:
 *   const { ref, isInView } = useInView();
 *   <section ref={ref}> ... </section>
 */
export function useInView(options?: IntersectionObserverInit) {
  const [isInView, setIsInView] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const ref = useCallback(
    (node: HTMLElement | null) => {
      // Disconnect any previous observer
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      if (!node || isInView) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        },
        { threshold: 0.15, ...options },
      );

      observer.observe(node);
      observerRef.current = observer;
    },
    [isInView],
  );

  return { ref, isInView };
}
