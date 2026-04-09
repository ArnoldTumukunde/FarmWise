import { useState, useEffect } from 'react';

import { fetchApi } from '@/lib/api';
import { useInView } from '@/hooks/useInView';
import { anim } from '@/lib/animations';

/* ── Types ── */

interface Category {
  id: string;
  slug: string;
  name: string;
  courseCount: number;
  imageUrl?: string | null;
}

/* ── Photo backgrounds per category (Unsplash) ── */

const CATEGORY_IMAGES: Record<string, string> = {
  'crop-farming':        'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=80',
  'livestock-poultry':   'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=400&q=80',
  'soil-health':         'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80',
  'pest-disease-control':'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
  'water-irrigation':    'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400&q=80',
  'agribusiness':        'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80',
  'post-harvest':        'https://images.unsplash.com/photo-1533062618053-d51e617307ec?w=400&q=80',
  'farm-technology':     'https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?w=400&q=80',
  'climate-environment': 'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=400&q=80',
  'organic-farming':     'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=400&q=80',
};



/* ── Single card ── */

function CategoryCard({ category, isVisible, index }: {
  category: Category;
  isVisible: boolean;
  index: number;
}) {
  const image = category.imageUrl || CATEGORY_IMAGES[category.slug] || 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400&q=80';

  return (
    <a
      href={`/courses?category=${category.slug}`}
      className="relative flex-shrink-0 overflow-hidden cursor-pointer
        transition-transform duration-300 hover:-translate-y-2 hover:shadow-2xl
        w-72 h-96"
      style={{
        backgroundImage: `url(${image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        ...anim.seedGrow(isVisible, index * 60),
      }}
    >
      {/* Bottom gradient overlay for text legibility */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(0deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.15) 45%, transparent 70%)',
        }}
      />

      {/* Text — top-left */}
      <div className="absolute top-4 left-4 right-4">
        <p className="text-white font-bold text-base leading-snug drop-shadow-lg">
          {category.name}
        </p>
      </div>
    </a>
  );
}

/* ── Fallback static categories ── */

const STATIC_CATEGORIES: Category[] = [
  { id: '1', slug: 'crop-farming', name: 'Crop Farming', courseCount: 0 },
  { id: '2', slug: 'livestock-poultry', name: 'Livestock & Poultry', courseCount: 0 },
  { id: '3', slug: 'soil-health', name: 'Soil Health', courseCount: 0 },
  { id: '4', slug: 'pest-disease-control', name: 'Pest & Disease Control', courseCount: 0 },
  { id: '5', slug: 'water-irrigation', name: 'Water & Irrigation', courseCount: 0 },
  { id: '6', slug: 'agribusiness', name: 'Agribusiness', courseCount: 0 },
  { id: '7', slug: 'post-harvest', name: 'Post-Harvest', courseCount: 0 },
  { id: '8', slug: 'farm-technology', name: 'Farm Technology', courseCount: 0 },
  { id: '9', slug: 'climate-environment', name: 'Climate & Environment', courseCount: 0 },
  { id: '10', slug: 'organic-farming', name: 'Organic Farming', courseCount: 0 },
];

/* ── Main carousel ── */

export function CategoryCarousel() {
  const { ref, isInView } = useInView();
  const [categories, setCategories] = useState<Category[]>(STATIC_CATEGORIES);

  useEffect(() => {
    fetchApi('/courses/categories')
      .then((data: any) => {
        const cats = Array.isArray(data) ? data : data.categories ?? data.data ?? [];
        if (cats.length > 0) {
          setCategories(cats.map((c: any) => ({
            id: c.id,
            slug: c.slug,
            name: c.name,
            courseCount: c.courseCount ?? c._count?.courses ?? 0,
            imageUrl: c.imageUrl ?? null,
          })));
        }
      })
      .catch(() => {});
  }, []);

  const doubled = [...categories, ...categories];

  return (
    <section ref={ref} className="overflow-hidden bg-white">
      {/* Scrolling track */}
      <div className="relative">
        <div
          className="flex gap-0"
          style={{
            width: 'max-content',
            animation: 'scrollCategories 40s linear infinite',
          }}
          onMouseEnter={e => (e.currentTarget.style.animationPlayState = 'paused')}
          onMouseLeave={e => (e.currentTarget.style.animationPlayState = 'running')}
        >
          {doubled.map((cat, i) => (
            <CategoryCard
              key={`${cat.slug}-${i}`}
              category={cat}
              isVisible={isInView}
              index={i < categories.length ? i : 0}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
