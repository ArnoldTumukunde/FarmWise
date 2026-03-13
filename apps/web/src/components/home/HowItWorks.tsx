import { useEffect, useRef, useState, useCallback } from 'react';
import { Search, Smartphone, Download, Wheat } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Step {
  num: number;
  icon: LucideIcon;
  title: string;
  desc: string;
}

const steps: Step[] = [
  {
    num: 1,
    icon: Search,
    title: 'Browse & Discover',
    desc: 'Explore hundreds of courses on crops, livestock, soil, and more.',
  },
  {
    num: 2,
    icon: Smartphone,
    title: 'Enroll',
    desc: 'Sign up free or purchase a course. Instant access to all lectures.',
  },
  {
    num: 3,
    icon: Download,
    title: 'Download Lectures',
    desc: 'Save lessons to your device. Study even without internet.',
  },
  {
    num: 4,
    icon: Wheat,
    title: 'Learn Anywhere',
    desc: 'Watch in the field, at home, or on the go — no signal needed.',
  },
];

export function HowItWorks() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  const handleIntersect = useCallback((entries: IntersectionObserverEntry[]) => {
    if (entries[0]?.isIntersecting) {
      setIsVisible(true);
    }
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(handleIntersect, {
      threshold: 0.2,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleIntersect]);

  return (
    <section id="how-it-works" ref={sectionRef} className="bg-[#FAFAF5]">
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#1B2B1B]">
            Learning that works in the field
          </h2>
          <p className="text-[#5A6E5A] mt-2">
            Four simple steps — from discovery to offline mastery.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-4 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="flex flex-col items-center text-center transition-all duration-700"
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
                  transitionDelay: `${idx * 150}ms`,
                }}
              >
                {/* Icon circle */}
                <div className="relative bg-[#2E7D32]/10 rounded-full p-4 w-16 h-16 flex items-center justify-center">
                  <Icon className="h-7 w-7 text-[#2E7D32]" />
                  {/* Step number badge */}
                  <span className="absolute -top-1 -right-1 bg-[#F57F17] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {step.num}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-[#1B2B1B] mt-4">
                  {step.title}
                </h3>
                <p className="text-sm text-[#5A6E5A] mt-2 max-w-[220px]">
                  {step.desc}
                </p>

                {/* Connector arrow */}
                {idx < steps.length - 1 && (
                  <>
                    {/* Desktop: horizontal dashed arrow */}
                    <div className="hidden md:block absolute top-8 text-[#2E7D32]/30" style={{ left: `${(idx + 1) * 25 - 4}%` }}>
                      <svg width="48" height="16" viewBox="0 0 48 16" fill="none">
                        <path
                          d="M0 8h40m0 0l-6-6m6 6l-6 6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeDasharray="4 4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    {/* Mobile: vertical arrow */}
                    <div className="md:hidden mt-4 text-[#2E7D32]/30">
                      <svg width="16" height="32" viewBox="0 0 16 32" fill="none">
                        <path
                          d="M8 0v24m0 0l-6-6m6 6l6-6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeDasharray="4 4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
