import { Star, MapPin } from 'lucide-react';
import { useInView } from '@/hooks/useInView';
import { anim } from '@/lib/animations';

const testimonials = [
  {
    name: 'James Okello',
    quote:
      'The soil health course changed how I prepare my land. My maize yield doubled in one season.',
    location: 'Lira, Uganda',
  },
  {
    name: 'Grace Mwangi',
    quote:
      'I downloaded all the livestock lectures before going to my farm. Watched them offline for a week.',
    location: 'Nakuru, Kenya',
  },
  {
    name: 'Emmanuel Nkusi',
    quote:
      'Free courses to start, then I bought the full agribusiness one. Worth every shilling.',
    location: 'Kigali, Rwanda',
  },
  {
    name: 'Fatuma Hassan',
    quote:
      "My phone has no internet in the field. AAN Academy still works — that's why I trust it.",
    location: 'Moshi, Tanzania',
  },
];

export function Testimonials() {
  const { ref, isInView } = useInView();

  return (
    <section ref={ref} className="bg-[#FAFAF5]">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#1B2B1B]">
            Trusted by farmers across East Africa
          </h2>
          <div className="flex items-center justify-center gap-1 mt-4">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className="w-5 h-5 text-[#F57F17] fill-[#F57F17]"
              />
            ))}
            <span className="text-[#5A6E5A] ml-2 text-sm">
              4.8 average from 3,200+ reviews
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              style={anim.rainDrop(isInView, i * 120)}
            >
              <span
                className="text-6xl text-[#F57F17] font-serif leading-none select-none inline-block"
                style={anim.leafSway(isInView)}
              >
                &ldquo;
              </span>
              <p className="text-base text-[#1B2B1B] italic mt-2">
                {t.quote}
              </p>
              <p className="text-sm font-semibold text-[#1B2B1B] mt-4">
                {t.name}
              </p>
              <p className="text-xs text-[#5A6E5A] flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3" />
                {t.location}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
