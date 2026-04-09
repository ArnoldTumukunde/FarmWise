import { Search, Smartphone, Download, Wheat } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useInView } from '@/hooks/useInView';
import { anim } from '@/lib/animations';

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
  const { ref, isInView } = useInView({ threshold: 0.2 });

  return (
    <section id="how-it-works" ref={ref} className="bg-[#FAFAF5]">
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

        {/* Desktop: flex row with arrows as direct siblings between steps */}
        <div className="hidden md:flex items-start justify-center gap-0">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={step.num} className="contents">
                {/* Step column */}
                <div className="flex flex-col items-center text-center w-48 px-2 flex-shrink-0">
                  <div style={anim.sproutUp(isInView, idx * 150)}>
                    <div className="relative w-20 h-20 rounded-full bg-[#2E7D32]/10 flex items-center justify-center mb-4">
                      <Icon className="h-8 w-8 text-[#2E7D32]" />
                      <span className="absolute -top-1 -right-1 bg-[#F57F17] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold overflow-hidden">
                        <span style={anim.countCrop(isInView, idx * 150 + 150)}>
                          {step.num}
                        </span>
                      </span>
                    </div>
                  </div>
                  <h3
                    className="text-lg font-semibold text-[#1B2B1B] mb-2"
                    style={anim.soilRise(isInView, idx * 150 + 100)}
                  >
                    {step.title}
                  </h3>
                  <p
                    className="text-sm text-[#5A6E5A] leading-relaxed"
                    style={anim.soilRise(isInView, idx * 150 + 150)}
                  >
                    {step.desc}
                  </p>
                </div>

                {/* Arrow — only between steps, not after the last one */}
                {idx < steps.length - 1 && (
                  <div
                    className="flex items-center flex-shrink-0 mt-10"
                    style={anim.fieldRow(isInView, idx * 150 + 120)}
                  >
                    <svg width="56" height="14" viewBox="0 0 56 14" fill="none">
                      <line x1="0" y1="7" x2="44" y2="7"
                        stroke="#2E7D32" strokeWidth="1.5" strokeDasharray="4 3" strokeLinecap="round" />
                      <path d="M42 2 L52 7 L42 12"
                        stroke="#2E7D32" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile: vertical stack with down-arrows */}
        <div className="flex flex-col items-center gap-6 md:hidden">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={step.num} className="flex flex-col items-center text-center">
                <div style={anim.sproutUp(isInView, idx * 150)}>
                  <div className="relative w-20 h-20 rounded-full bg-[#2E7D32]/10 flex items-center justify-center">
                    <Icon className="h-8 w-8 text-[#2E7D32]" />
                    <span className="absolute -top-1 -right-1 bg-[#F57F17] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold overflow-hidden">
                      <span style={anim.countCrop(isInView, idx * 150 + 150)}>
                        {step.num}
                      </span>
                    </span>
                  </div>
                </div>
                <h3
                  className="text-lg font-semibold text-[#1B2B1B] mt-4"
                  style={anim.soilRise(isInView, idx * 150 + 100)}
                >
                  {step.title}
                </h3>
                <p
                  className="text-sm text-[#5A6E5A] mt-2 max-w-[220px]"
                  style={anim.soilRise(isInView, idx * 150 + 150)}
                >
                  {step.desc}
                </p>
                {idx < steps.length - 1 && (
                  <div
                    className="mt-4 text-[#2E7D32]/30"
                    style={anim.fieldRow(isInView, idx * 150 + 120)}
                  >
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
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
