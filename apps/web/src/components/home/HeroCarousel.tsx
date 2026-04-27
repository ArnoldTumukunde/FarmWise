import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Sprout, BookOpen, Users } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { fetchApi } from '@/lib/api';

interface Slide {
  id: string;
  gradient: string;
  heading: string;
  body: string;
  cta: string;
  href: string;
  icon: React.ReactNode;
}

export function HeroCarousel() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [activeSlide, setActiveSlide] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const u = user as any;
  const [profileName, setProfileName] = useState<string>('');

  useEffect(() => {
    if (!user) return;
    fetchApi('/profile')
      .then((res: any) => {
        const p = res.profile || res;
        setProfileName(p.username || p.displayName || '');
      })
      .catch(() => { /* fall back to other sources below */ });
  }, [user]);

  const firstName = profileName.split(' ')[0]
    || u?.name?.split(' ')[0]
    || u?.email?.split('@')[0]
    || 'Farmer';

  const slides: Slide[] = [
    {
      id: 'continue',
      gradient: 'linear-gradient(135deg, #1A2E1A 0%, #2E5E2E 100%)',
      heading: `${firstName}, keep it up!`,
      body: "You're making great progress. Keep learning to grow your farming skills.",
      cta: 'Continue learning',
      href: '/my-learning',
      icon: <BookOpen size={40} className="text-green-300/40" />,
    },
    {
      id: 'season',
      gradient: 'linear-gradient(135deg, #2E4A1E 0%, #3D6B2A 100%)',
      heading: 'Grow more this season',
      body: 'Expert courses on soil preparation, seed selection, and crop management — ready to download for the field.',
      cta: 'Browse crop courses',
      href: '/courses?category=crop-farming',
      icon: <Sprout size={40} className="text-green-300/40" />,
    },
    {
      id: 'teach',
      gradient: 'linear-gradient(135deg, #1A3A1A 0%, #2E5840 100%)',
      heading: 'Teach what you know',
      body: 'Share your agricultural expertise with farmers across East Africa. Keep 70% of every course sale.',
      cta: 'Become an instructor',
      href: '/become-instructor',
      icon: <Users size={40} className="text-green-300/40" />,
    },
  ];

  const startAutoAdvance = useCallback(() => {
    intervalRef.current = setInterval(() => {
      setActiveSlide(i => (i + 1) % slides.length);
    }, 6000);
  }, [slides.length]);

  const stopAutoAdvance = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    startAutoAdvance();
    return stopAutoAdvance;
  }, [startAutoAdvance, stopAutoAdvance]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-64 md:h-80 overflow-hidden"
      onMouseEnter={stopAutoAdvance}
      onMouseLeave={startAutoAdvance}
    >
      {/* Slides track */}
      <div
        className="flex h-full transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${activeSlide * 100}%)` }}
      >
        {slides.map((slide) => (
          <div
            key={slide.id}
            className="relative w-full h-full flex-shrink-0"
            style={{ background: slide.gradient }}
          >
            <div className="h-full flex items-center px-6 md:px-12 lg:px-16 max-w-[1340px] mx-auto">
              {/* Left side — text */}
              <div className="w-full md:w-1/2 z-10">
                <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                  {slide.heading}
                </h2>
                <p className="text-sm text-green-200 mt-2 max-w-md leading-relaxed">
                  {slide.body}
                </p>
                <button
                  onClick={() => navigate(slide.href)}
                  className="bg-white text-primary font-semibold px-6 py-2.5 rounded-lg mt-4 hover:bg-gray-50 transition-colors text-sm"
                >
                  {slide.cta}
                </button>
              </div>
              {/* Right side — decorative */}
              <div className="hidden md:flex w-1/2 items-center justify-center">
                <div className="w-48 h-48 rounded-full bg-white/5 flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full bg-white/5 flex items-center justify-center">
                    {slide.icon}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Left arrow */}
      <button
        onClick={() => setActiveSlide(i => (i - 1 + slides.length) % slides.length)}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white transition-colors z-10"
        aria-label="Previous slide"
      >
        <ChevronLeft size={18} />
      </button>

      {/* Right arrow */}
      <button
        onClick={() => setActiveSlide(i => (i + 1) % slides.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white transition-colors z-10"
        aria-label="Next slide"
      >
        <ChevronRight size={18} />
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveSlide(i)}
            className={`rounded-full transition-all duration-300 ${
              i === activeSlide ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/40'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
