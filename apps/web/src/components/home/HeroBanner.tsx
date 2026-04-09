import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { anim } from '@/lib/animations';

const benefits = [
  'Works offline, even without internet',
  'Taught by certified agricultural experts',
  'Courses in crop farming, livestock & more',
  'Free courses available, no card needed',
];

export function HeroBanner() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="relative min-h-[600px] md:min-h-[700px] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#1A2E1A] via-[#2E7D32]/80 to-[#1A2E1A]" />
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="absolute inset-0 bg-black/30" />

      <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24 flex flex-col lg:grid lg:grid-cols-12 lg:gap-8 lg:items-center min-h-[600px] md:min-h-[700px]">
        <div className="lg:col-span-7 space-y-6 text-white">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
            <span className="inline-block" style={anim.harvestReveal(mounted, 0)}>
              Grow your farm.
            </span>
            <br />
            <span className="inline-block" style={anim.harvestReveal(mounted, 150)}>
              Grow your knowledge.
            </span>
          </h1>
          <p
            className="text-lg md:text-xl text-white/80 max-w-lg"
            style={anim.soilRise(mounted, 300)}
          >
            Expert courses on crops, livestock, soil health, and more — built
            for farmers, downloadable for offline use in the field.
          </p>
          <div className="flex flex-wrap gap-3 pt-2" style={anim.soilRise(mounted, 450)}>
            <Link
              to="/courses?filter=free"
              className="inline-flex items-center px-6 py-3 bg-[#F57F17] hover:bg-[#FFB300] text-white font-semibold rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F57F17] focus-visible:ring-offset-2"
            >
              Browse Free Courses
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center px-6 py-3 border border-white/40 text-white hover:bg-white/10 font-medium rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
            >
              See how it works &darr;
            </a>
          </div>

          <div className="flex flex-wrap gap-3" style={anim.soilRise(mounted, 600)}>
            <span className="text-sm text-white/70 bg-white/10 px-3 py-1.5 rounded-full">
              12,000+ farmers
            </span>
            <span className="text-sm text-white/70 bg-white/10 px-3 py-1.5 rounded-full">
              Works offline
            </span>
            <span className="text-sm text-white/70 bg-white/10 px-3 py-1.5 rounded-full">
              Free courses
            </span>
          </div>
        </div>

        <div className="lg:col-span-5 mt-10 lg:mt-0" style={anim.heroCard(mounted, 200)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 lg:sticky lg:top-24">
            <h2 className="text-xl font-bold text-[#1B2B1B] mb-4">
              Start learning — free today
            </h2>
            <ul className="space-y-3 mb-6">
              {benefits.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-[#2E7D32] shrink-0 mt-0.5" />
                  <span className="text-sm text-[#1B2B1B]/80">{item}</span>
                </li>
              ))}
            </ul>
            <Link
              to="/register"
              className="block w-full text-center px-6 py-3 bg-[#2E7D32] hover:bg-[#4CAF50] text-white font-semibold rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
            >
              Get Started Free
            </Link>
            <p className="text-center mt-3">
              <Link
                to="/login"
                className="text-sm text-[#5A6E5A] hover:text-[#2E7D32] transition-colors"
              >
                Already a member? Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
