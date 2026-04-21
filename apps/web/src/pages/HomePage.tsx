import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { HeroBanner } from '@/components/home/HeroBanner';
import { CategoryCarousel } from '@/components/home/CategoryCarousel';
import { StatsStrip } from '@/components/home/StatsStrip';
import { FeaturedCourses } from '@/components/home/FeaturedCourses';
import { HowItWorks } from '@/components/home/HowItWorks';
import { FeaturedInstructors } from '@/components/home/FeaturedInstructors';
import { Testimonials } from '@/components/home/Testimonials';
import { TeachCTA } from '@/components/home/TeachCTA';
import { FAQ } from '@/components/home/FAQ';
import { HomeFooter } from '@/components/home/HomeFooter';
import { Sponsors } from '@/components/home/Sponsors';

/* ── Crop-row divider between major sections ── */
function CropRowDivider() {
  return (
    <div className="w-full overflow-hidden h-6 relative" aria-hidden="true">
      {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
        <div
          key={i}
          className="absolute left-0 right-0 h-px bg-primary/8"
          style={{ top: `${(i / 7) * 100}%` }}
        />
      ))}
    </div>
  );
}

export default function HomePage() {
  const [stats, setStats] = useState({ farmerCount: 0, courseCount: 0, instructorCount: 0 });

  useEffect(() => {
    fetchApi('/stats/public')
      .then(setStats)
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAF5] font-[Inter]">
      <HeroBanner />
      <CategoryCarousel />
      <StatsStrip stats={stats} />
      <Sponsors />
      <CropRowDivider />
      <FeaturedCourses />
      <CropRowDivider />
      <HowItWorks />
      <CropRowDivider />
      <FeaturedInstructors />
      <CropRowDivider />
      <Testimonials />
      <CropRowDivider />
      <TeachCTA />
      <FAQ />
      <HomeFooter />
    </div>
  );
}
