import { Link } from 'react-router-dom';
import { CheckCircle, Wheat } from 'lucide-react';
import { useInView } from '@/hooks/useInView';
import { anim } from '@/lib/animations';

const perks = [
  'Earn while you sleep',
  'Free tools to build your course',
  'We handle payments & delivery',
];

export function TeachCTA() {
  const { ref, isInView } = useInView();

  return (
    <section ref={ref} className="bg-[#1A2E1A]">
      <div className="max-w-7xl mx-auto px-4 py-16 md:py-20">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left column — harvest-reveal animation */}
          <div style={anim.harvestReveal(isInView, 0)}>
            <h2 className="text-3xl font-bold text-white">
              Share your agricultural knowledge. Earn from it.
            </h2>
            <p className="text-green-100 mt-4">
              Teach crop science, livestock management, or agribusiness. AAN Academy
              connects you with thousands of farmers across East Africa.
            </p>

            <ul className="mt-6 space-y-3">
              {perks.map((perk, i) => (
                <li
                  key={perk}
                  className="flex items-center gap-3"
                  style={anim.rainDrop(isInView, 300 + i * 100)}
                >
                  <CheckCircle className="w-5 h-5 text-[#F57F17] flex-shrink-0" />
                  <span className="text-green-100">{perk}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-3 mt-8">
              <Link
                to="/register"
                className="bg-[#F57F17] hover:bg-[#FFB300] text-white px-6 py-3 rounded-full font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
              >
                Start Teaching
              </Link>
              <Link
                to="/become-instructor"
                className="border border-white/30 text-white hover:bg-white/10 px-6 py-3 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
              >
                Learn more
              </Link>
            </div>
          </div>

          {/* Right column — soil-rise animation */}
          <div
            className="hidden lg:flex items-center justify-center"
            style={anim.soilRise(isInView, 200)}
          >
            <div className="w-72 h-72 rounded-full bg-gradient-to-br from-[#2E7D32]/40 to-[#F57F17]/20 flex items-center justify-center">
              <Wheat className="w-32 h-32 text-green-100/60" strokeWidth={1} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
