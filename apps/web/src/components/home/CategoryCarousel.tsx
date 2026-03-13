import { Link } from 'react-router-dom';
import {
  Wheat,
  Beef,
  Sprout,
  Bug,
  CloudRain,
  TrendingUp,
  Package,
  Cpu,
  Sun,
  Leaf,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Category {
  slug: string;
  name: string;
  icon: LucideIcon;
  gradient: string;
}

const categories: Category[] = [
  { slug: 'crop-farming', name: 'Crop Farming', icon: Wheat, gradient: 'from-green-600 to-green-800' },
  { slug: 'livestock', name: 'Livestock & Poultry', icon: Beef, gradient: 'from-amber-600 to-amber-800' },
  { slug: 'soil-health', name: 'Soil Health', icon: Sprout, gradient: 'from-emerald-600 to-emerald-800' },
  { slug: 'pest-control', name: 'Pest & Disease Control', icon: Bug, gradient: 'from-red-600 to-red-800' },
  { slug: 'irrigation', name: 'Water & Irrigation', icon: CloudRain, gradient: 'from-blue-600 to-blue-800' },
  { slug: 'agribusiness', name: 'Agribusiness', icon: TrendingUp, gradient: 'from-purple-600 to-purple-800' },
  { slug: 'post-harvest', name: 'Post-Harvest', icon: Package, gradient: 'from-orange-600 to-orange-800' },
  { slug: 'farm-tech', name: 'Farm Technology', icon: Cpu, gradient: 'from-cyan-600 to-cyan-800' },
  { slug: 'climate', name: 'Climate & Environment', icon: Sun, gradient: 'from-yellow-600 to-yellow-800' },
  { slug: 'organic', name: 'Organic Farming', icon: Leaf, gradient: 'from-lime-600 to-lime-800' },
];

// Duplicate for seamless infinite scroll
const doubled = [...categories, ...categories];

export function CategoryCarousel() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <style>{`
        @keyframes scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>

      <h2 className="text-2xl font-semibold text-[#1B2B1B] mb-6">
        Explore by topic
      </h2>

      <div className="overflow-hidden">
        <div
          className="flex gap-4 hover:[animation-play-state:paused]"
          style={{
            animation: 'scroll 40s linear infinite',
            width: 'max-content',
          }}
        >
          {doubled.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <Link
                key={`${cat.slug}-${i}`}
                to={`/courses?categoryId=${cat.slug}`}
                className={`shrink-0 w-36 h-48 md:w-48 md:h-64 rounded-xl bg-gradient-to-br ${cat.gradient} flex flex-col items-center justify-center gap-4 p-4 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2`}
              >
                <Icon className="h-10 w-10 md:h-14 md:w-14 text-white/70" />
                <span className="text-sm md:text-base font-bold text-white text-center leading-tight">
                  {cat.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
