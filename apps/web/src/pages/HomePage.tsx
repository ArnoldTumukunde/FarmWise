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
      <FeaturedCourses />
      <HowItWorks />
      <FeaturedInstructors />
      <Testimonials />
      <TeachCTA />
      <FAQ />
      <HomeFooter />
    </div>
  );
}
