import { WelcomeBanner } from '@/components/home/WelcomeBanner';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { HomeContinueLearningStrip } from '@/components/home/ContinueLearningStrip';
import { FeaturedCollectionBlock } from '@/components/home/FeaturedCollectionBlock';
import { WhatToLearnNextSection } from '@/components/home/WhatToLearnNextSection';
import { TopPickForYou } from '@/components/home/TopPickForYou';
import { TrendingCoursesStrip } from '@/components/home/TrendingCoursesStrip';
import { BecauseYouEnrolledStrip } from '@/components/home/BecauseYouEnrolledStrip';
import { ShortCoursesStrip } from '@/components/home/ShortCoursesStrip';
import { TopicsRecommendedSection } from '@/components/home/TopicsRecommendedSection';
import { TrustedByFarmersBar } from '@/components/home/TrustedByFarmersBar';
import { Sponsors } from '@/components/home/Sponsors';

export default function LoggedInHomePage() {
  return (
    <div className="min-h-screen bg-surface">
      {/* 1. Greeting — lightweight, no card, sits on bg-surface */}
      <div className="max-w-[1340px] mx-auto">
        <WelcomeBanner />
      </div>

      {/* 2. Hero carousel — full-width, no max-w constraint */}
      <HeroCarousel />

      {/* 3–10. Sectioned content within max-width */}
      <div className="max-w-[1340px] mx-auto">
        {/* 3. Continue learning strip */}
        <HomeContinueLearningStrip />

        {/* 4. Featured collection block */}
        <FeaturedCollectionBlock />

        {/* 5. What to learn next (top category + because you viewed) */}
        <WhatToLearnNextSection />

        {/* 6. Top pick for you */}
        <TopPickForYou />

        {/* 7. Trending courses */}
        <TrendingCoursesStrip />

        {/* 8. Because you enrolled in X */}
        <BecauseYouEnrolledStrip />

        {/* 9. Short courses */}
        <ShortCoursesStrip />

        {/* 10. Topics recommended */}
        <TopicsRecommendedSection />
      </div>

      {/* 11. Sponsors — subtle logo strip */}
      <Sponsors />

      {/* 12. Trusted by bar — full-width, last before footer */}
      <TrustedByFarmersBar />
    </div>
  );
}
