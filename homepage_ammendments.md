# FarmWise Homepage — Three-Issue Fix Instructions

> Read `design-system/SKILL.md` before touching anything.
> These instructions cover three separate issues observed in screenshots 1–9 of the
> current public homepage (not the logged-in homepage). Do not change the logged-in
> homepage. Do not change any backend code.

---

# ISSUE 1 — SECTION TRANSITION ANIMATIONS
# Creative agricultural-themed scroll animations

## What the page currently has
Zero animations. Every section appears statically as the user scrolls.

## Philosophy
Do NOT use generic slide-up / fade-in / zoom-in animations found in every template
on the internet. Every animation on FarmWise must be rooted in the lived experience
of farming: seeds, soil, growth, harvest, rainfall, sunlight, field rows.
The animations should feel like the platform understands agriculture.

## Technical setup

Install `tailwindcss-animate` if not already installed (for the CSS classes) and use
`IntersectionObserver` via a custom hook for scroll-triggered animations.

Create `apps/web/src/hooks/useInView.ts`:
```typescript
import { useEffect, useRef, useState } from 'react';

export function useInView(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        observer.unobserve(el); // fire once only
      }
    }, { threshold: 0.15, ...options });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, isInView };
}
```

Add to `apps/web/src/index.css` (the custom keyframes — do NOT put in tailwind.config
because these are too complex for the Tailwind plugin):

```css
/* ── FarmWise custom animation keyframes ── */

@keyframes seedGrow {
  0%   { transform: scaleY(0) translateY(20px); opacity: 0; transform-origin: bottom; }
  60%  { transform: scaleY(1.05) translateY(-3px); opacity: 1; transform-origin: bottom; }
  100% { transform: scaleY(1) translateY(0); opacity: 1; transform-origin: bottom; }
}

@keyframes soilRise {
  0%   { transform: translateY(40px); opacity: 0; filter: blur(4px); }
  100% { transform: translateY(0); opacity: 1; filter: blur(0); }
}

@keyframes fieldRow {
  0%   { transform: scaleX(0); opacity: 0; transform-origin: left; }
  100% { transform: scaleX(1); opacity: 1; transform-origin: left; }
}

@keyframes rainDrop {
  0%   { transform: translateY(-12px) scaleY(0.6); opacity: 0; }
  40%  { opacity: 1; }
  100% { transform: translateY(0) scaleY(1); opacity: 1; }
}

@keyframes harvestReveal {
  0%   { clip-path: inset(0 100% 0 0); opacity: 0; }
  100% { clip-path: inset(0 0% 0 0); opacity: 1; }
}

@keyframes leafSway {
  0%, 100% { transform: rotate(-4deg) translateX(0); }
  50%       { transform: rotate(4deg) translateX(6px); }
}

@keyframes countCrop {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}

@keyframes sproutUp {
  0%   { transform: scaleY(0); transform-origin: bottom center; }
  70%  { transform: scaleY(1.08); transform-origin: bottom center; }
  100% { transform: scaleY(1); transform-origin: bottom center; }
}

.animate-seed-grow    { animation: seedGrow    0.7s cubic-bezier(0.34,1.56,0.64,1) both; }
.animate-soil-rise    { animation: soilRise    0.6s ease-out both; }
.animate-field-row    { animation: fieldRow    0.8s ease-out both; }
.animate-rain-drop    { animation: rainDrop    0.5s ease-out both; }
.animate-harvest-reveal { animation: harvestReveal 0.9s ease-out both; }
.animate-leaf-sway    { animation: leafSway    3s ease-in-out infinite; }
.animate-sprout-up    { animation: sproutUp    0.6s cubic-bezier(0.34,1.56,0.64,1) both; }
```

---

## Animation spec — section by section

### Hero section — NO scroll trigger (above the fold, must be instant on page load)

Apply these animations when the component mounts (use `useEffect` with no dependency
on scroll):

- **H1 line 1** ("Grow your farm."): `animate-harvest-reveal`, delay 0ms
- **H1 line 2** ("Grow your knowledge."): `animate-harvest-reveal`, delay 150ms
- **Subtitle paragraph**: `animate-soil-rise`, delay 300ms
- **CTA buttons**: `animate-soil-rise`, delay 450ms
- **Trust pills** ("12,000+ farmers", "Works offline"): `animate-soil-rise`, delay 600ms
- **Floating card** (right side): `animate-soil-rise` with `translateX(20px)` start, delay 200ms

The `harvestReveal` animation uses `clip-path: inset(0 100% 0 0)` → `inset(0 0% 0 0)`
which reveals the text like a harvester moving across a field left-to-right.
This is intentional — it is not a generic slide or fade.

### Section divider between hero and category carousel

Add a full-width decorative crop-row divider between EVERY major section (hero, stats strip,
how it works, instructors, testimonials, teach CTA). This divider is a visual element
that references ploughed field rows:

```tsx
function CropRowDivider() {
  return (
    <div className="w-full overflow-hidden h-6 relative" aria-hidden="true">
      {/* 8 horizontal lines that look like ploughed field rows viewed from above */}
      {[0,1,2,3,4,5,6,7].map(i => (
        <div
          key={i}
          className="absolute left-0 right-0 h-px bg-primary/8"
          style={{ top: `${(i / 7) * 100}%` }}
        />
      ))}
    </div>
  );
}
```

### CategoryCarousel — scroll triggered

Each card in the carousel uses `animate-seed-grow` with staggered delays.
Because the carousel auto-scrolls, apply the animation only to the first full set of
cards (not the duplicated set). Use the `useInView` hook on the section wrapper.

```tsx
const { ref: sectionRef, isInView } = useInView();

// On the section wrapper:
<section ref={sectionRef as React.RefObject<HTMLElement>}>
  <div className="carousel-track">
    {categories.map((cat, i) => (
      <div
        key={cat.slug}
        className={isInView ? 'animate-seed-grow' : 'opacity-0'}
        style={{ animationDelay: `${i * 60}ms` }}
      >
        <CategoryCard category={cat} />
      </div>
    ))}
  </div>
</section>
```

### StatsStrip — scroll triggered counter animation

The numbers in the stats strip must count up from 0 when the section enters the viewport.
This is the "crop yield growing" metaphor.

```typescript
function useCountUp(target: number, isActive: boolean, duration = 1800) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!isActive) return;
    const start = performance.now();
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [isActive, target, duration]);

  return current;
}
```

Display format: if `target >= 1000`, show as `"{Math.floor(current/1000)}k+"`.
Otherwise show as `"{current}+"`.

Additionally, each stat card enters with `animate-rain-drop` staggered by 100ms per card.
The rain-drop animation references rain falling on crops — each stat "drops" into place.

### FeaturedCourses — scroll triggered

Course cards enter with `animate-soil-rise` staggered by 80ms each.
The tab strip enters with `animate-field-row` (left-to-right reveal) on first view.

### HowItWorks — scroll triggered

This is the richest animation on the page.

**Step circles**: use `animate-sprout-up` staggered 150ms per step.
The "sprout up" metaphor is explicit — each step grows upward like a seedling.

**Dashed connector lines** between steps: use `animate-field-row` on each connector,
staggered so connector 1 animates AFTER step 1 finishes, connector 2 AFTER step 2, etc.
The field-row animation (left-to-right scale) mimics planting rows being added one by one.

**Step number badges**: use a CSS counter animation that flips the number in from below
using `countCrop` keyframe (translate from 100% to 0), 150ms after each circle appears.

```tsx
// On the HowItWorks section wrapper:
const { ref, isInView } = useInView({ threshold: 0.2 });

// Each step:
<div
  className={isInView ? 'animate-sprout-up' : 'opacity-0 scale-y-0'}
  style={{ animationDelay: `${stepIndex * 150}ms` }}
>
  ...
</div>

// Each connector:
<div
  className={isInView ? 'animate-field-row' : 'opacity-0 scale-x-0'}
  style={{ animationDelay: `${(stepIndex * 150) + 120}ms` }}
>
  <div className="h-px border-dashed border-t-2 border-primary/30 w-full" />
</div>
```

### FeaturedInstructors — scroll triggered

Instructor cards use `animate-soil-rise` in a 2-step stagger:
- Row 1 cards (indices 0–3): delay 0, 80, 160, 240ms
- Row 2 cards (indices 4–7): delay 200, 280, 360, 440ms

This creates a "harvesting across two rows of a field" visual rhythm.

### Testimonials — scroll triggered

Each testimonial card uses `animate-rain-drop` staggered 120ms per card.
The opening quote mark (`"`) additionally uses `animate-leaf-sway` — it gently sways
after it appears, referencing leaves moving in a farm breeze.
Apply `animate-leaf-sway` ONLY to the `"` character, not the card wrapper.

### TeachCTA — scroll triggered

Left column (text + checklist): `animate-harvest-reveal` — reveals left to right.
Right column (illustration): `animate-soil-rise` with 200ms delay.
Each checklist item: `animate-rain-drop` staggered 100ms per item, after the column appears.

---

# ISSUE 2 — INSTRUCTOR CARDS: FIX PROPORTIONS, HOVER, AND PROFILE PAGE

## What's wrong (from screenshots 4–5)
1. Cards are enormous — each colored square is approximately 300×280px filling the full
   column width with just 2 huge letters (e.g. "SA", "JM") centered in the middle.
   This wastes space and looks unprofessional.
2. Hover state causes text overflow — the "MEET / Name / Title" text below does not
   fit within the card column width and overflows or wraps badly.
3. Clicking a card does nothing — it should navigate to `/instructors/{instructor.id}`.
4. The instructor profile page exists but lacks: total students metric, overall star
   rating, and farmer reviews pulled from their courses.

---

## Fix 2A — Instructor card dimensions and layout

File: `apps/web/src/components/home/FeaturedInstructors.tsx`
(or wherever the `InstructorCard` sub-component lives — find it and fix it there)

### Correct card dimensions
Each instructor card must use this exact structure. Replace whatever currently exists:

```tsx
function InstructorCard({ instructor }: { instructor: HomepageInstructor }) {
  return (
    <a
      href={`/instructors/${instructor.id}`}
      className="block group cursor-pointer"
      aria-label={`View ${instructor.name}'s profile`}
    >
      {/* Photo / avatar area — aspect-square, max 100% column width */}
      <div className="aspect-square w-full rounded-xl overflow-hidden relative mb-3">

        {instructor.avatarUrl ? (
          <img
            src={instructor.avatarUrl}
            alt={instructor.name}
            className="w-full h-full object-cover transition-transform duration-300
                       group-hover:scale-105"
          />
        ) : (
          /* Fallback: initials on earthy gradient, NOT a bright random color */
          <div className={`w-full h-full flex items-center justify-center
                          ${getInstructorGradient(instructor.id)}`}>
            <span className="text-white font-bold text-3xl select-none">
              {getInitials(instructor.name)}
            </span>
          </div>
        )}

        {/* Hover overlay — appears on group-hover */}
        <div className="absolute inset-0 bg-surface-dark/70 opacity-0 group-hover:opacity-100
                        transition-opacity duration-200 flex items-center justify-center">
          <span className="text-white text-sm font-semibold px-4 py-2 border border-white/40
                           rounded-full">
            View profile →
          </span>
        </div>
      </div>

      {/* Text below — constrained to card width, no overflow */}
      <div className="px-0.5">
        <p className="text-[10px] font-bold text-accent tracking-widest uppercase mb-0.5">
          Meet
        </p>
        <p className="text-sm font-semibold text-text-base leading-snug line-clamp-1">
          {instructor.name}
        </p>
        <p className="text-xs text-text-muted leading-snug line-clamp-2 mt-0.5">
          {instructor.title}
        </p>
      </div>
    </a>
  );
}
```

### `getInitials` helper:
```typescript
function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();
}
```

### `getInstructorGradient` — replace random bright colors with earthy FarmWise gradients:
```typescript
const GRADIENTS = [
  'bg-gradient-to-br from-[#1b4332] to-[#2d6a4f]',   // deep forest green
  'bg-gradient-to-br from-[#7b3f00] to-[#a0522d]',   // warm soil brown
  'bg-gradient-to-br from-[#2c4a1e] to-[#4a7c59]',   // sage green
  'bg-gradient-to-br from-[#1a3a1a] to-[#2E7D32]',   // primary green
  'bg-gradient-to-br from-[#3b2e00] to-[#7a6010]',   // harvest gold dark
  'bg-gradient-to-br from-[#1a2e1a] to-[#344e41]',   // dark olive
  'bg-gradient-to-br from-[#0d3b5e] to-[#1e6091]',   // rain blue
  'bg-gradient-to-br from-[#3b1f00] to-[#6d3a1f]',   // clay red-brown
];

function getInstructorGradient(id: string): string {
  // Deterministic: same instructor always gets same gradient
  const index = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % GRADIENTS.length;
  return GRADIENTS[index];
}
```

### Grid layout — the grid must show maximum 4 columns, 2 rows = 8 cards:
```tsx
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 md:gap-6">
  {instructors.slice(0, 8).map(instructor => (
    <InstructorCard key={instructor.id} instructor={instructor} />
  ))}
</div>
```

`gap-5` gives enough breathing room between cards without the initials area looking cramped.
`slice(0, 8)` caps at 8 instructors — 4 per row × 2 rows.

### Data shape required from API:
```typescript
interface HomepageInstructor {
  id: string;
  name: string;
  title: string;          // e.g. "Soil Scientist, Makerere University"
  avatarUrl: string | null;
  courseCount: number;
  studentCount: number;
  averageRating: number;
}
```
API endpoint (already exists or add if missing): `GET /api/v1/instructors/featured?limit=8`

---

## Fix 2B — Instructor Profile Page: add metrics and reviews

File: `apps/web/src/pages/InstructorProfilePage.tsx` or
`apps/web/src/components/instructor/InstructorProfilePage.tsx`

Route: `/instructors/:id`

The instructor profile page currently shows basic info. It must be enhanced to show:
- Total students across ALL their published courses (sum of enrollment counts)
- Overall star rating (weighted average of all ratings across all courses)
- A selection of 3 farmer reviews randomly sampled from reviews left on any of their courses
- All published courses via the existing `<CourseStrip />` component

### Instructor Hero — exact layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  bg-surface-dark, px-4 md:px-10 py-12                               │
│                                                                     │
│  flex items-start gap-8                                             │
│                                                                     │
│  [Avatar 96px]                                                      │
│  ┌──────────────────────────────────────────────┐                  │
│  │  Dr. Sarah Akello                            │  text-3xl font-bold text-white
│  │  Soil Scientist · Makerere University        │  text-base text-green-200 mt-1
│  │                                              │
│  │  ★ 4.8 Instructor rating  ·  2,341 Students │  text-sm text-green-100 mt-3
│  │  ·  5 Courses             ·  412 Reviews    │
│  └──────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────────────┘
```

### Stats row — exact implementation:
```tsx
<div className="flex items-center gap-6 mt-4 flex-wrap">
  {[
    { icon: <Star size={14} fill="#F57F17" stroke="#F57F17" />,
      value: `${instructor.averageRating.toFixed(1)} ★`,
      label: 'Instructor rating' },
    { icon: <Users size={14} className="text-green-300" />,
      value: instructor.totalStudents.toLocaleString(),
      label: 'Students' },
    { icon: <BookOpen size={14} className="text-green-300" />,
      value: String(instructor.courseCount),
      label: 'Courses' },
    { icon: <MessageSquare size={14} className="text-green-300" />,
      value: instructor.totalReviews.toLocaleString(),
      label: 'Reviews' },
  ].map(stat => (
    <div key={stat.label} className="flex items-center gap-1.5 text-sm text-green-100">
      {stat.icon}
      <strong className="text-white">{stat.value}</strong>
      <span className="text-green-200">{stat.label}</span>
    </div>
  ))}
</div>
```

Separator between stats: a `·` character in `text-green-300/40`.

### API endpoint needed:
`GET /api/v1/instructors/:id` must return:
```typescript
{
  id: string;
  name: string;
  title: string;
  avatarUrl: string | null;
  bio: string;                    // HTML from TipTap, sanitised
  courseCount: number;            // published courses only
  totalStudents: number;          // SUM of enrollment counts across all courses
  averageRating: number;          // weighted average: sum(rating * reviewCount) / sum(reviewCount)
  totalReviews: number;           // total review count across all courses
  courses: CourseCardData[];      // all published courses, sorted by enrollment DESC
  featuredReviews: InstructorReview[];  // 3 reviews, see below
}
```

`totalStudents` computed in the service layer:
```typescript
const totalStudents = await prisma.enrollment.count({
  where: { course: { instructorId: id, status: 'PUBLISHED' } }
});
```

`averageRating` computed:
```typescript
const ratings = await prisma.review.aggregate({
  where: { course: { instructorId: id } },
  _avg: { rating: true },
  _count: { id: true },
});
const averageRating = ratings._avg.rating ?? 0;
const totalReviews = ratings._count.id;
```

`featuredReviews` — 3 reviews randomly sampled across all instructor courses,
where `review.rating >= 4` (only show positive reviews in the profile showcase):
```typescript
// Use raw SQL for random sampling (efficient)
const featuredReviews = await prisma.$queryRaw`
  SELECT r.id, r.body, r.rating, r."createdAt",
         u.name as "authorName",
         c.title as "courseTitle"
  FROM "Review" r
  JOIN "User" u ON r."userId" = u.id
  JOIN "Course" c ON r."courseId" = c.id
  WHERE c."instructorId" = ${id}
    AND r.rating >= 4
    AND length(r.body) > 30
  ORDER BY RANDOM()
  LIMIT 3
`;
```

### Farmer Reviews section on instructor profile:

```
"What farmers say about {instructor.firstName}'s courses"
```

3 review cards in a `grid grid-cols-1 md:grid-cols-3 gap-4`:

Each card: `bg-white rounded-xl border border-gray-200 p-5`
```tsx
<div className="bg-white rounded-xl border border-gray-200 p-5">
  {/* Stars */}
  <div className="flex gap-0.5 mb-3">
    {[1,2,3,4,5].map(i => (
      <Star key={i} size={13}
        fill={i <= review.rating ? '#F57F17' : 'none'}
        stroke="#F57F17" />
    ))}
  </div>

  {/* Review body */}
  <p className="text-sm text-text-base italic leading-relaxed line-clamp-4">
    "{review.body}"
  </p>

  {/* Author */}
  <div className="mt-4 flex items-center gap-2">
    <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center
                    text-primary text-xs font-bold flex-shrink-0">
      {review.authorName[0]}
    </div>
    <div>
      <p className="text-xs font-semibold text-text-base">{review.authorName}</p>
      <p className="text-[11px] text-text-muted">on "{review.courseTitle}"</p>
    </div>
  </div>
</div>
```

### Full instructor profile page section order:
1. `<InstructorHero />` — dark bg, avatar, name, title, stats
2. `<InstructorAbout />` — bio, expandable at 400 chars
3. `<CourseStrip title={`Courses by ${instructor.name}`} courses={instructor.courses} />` — all published
4. `<InstructorReviews reviews={instructor.featuredReviews} name={instructor.name} />` — 3 cards
5. `<Footer />`

---

# ISSUE 3 — CATEGORY CAROUSEL: FIX TO MATCH SKILLSHARE EXACTLY

## What's wrong (from screenshot 2)

The current implementation shows large square/portrait cards with FLAT SOLID COLORED
backgrounds (orange, green, red, blue, purple, orange) and just an icon + text centered.
These are not portrait cards — they are too wide, too square, wrong proportions, and the
colors are garish and unrelated to agriculture.

Skillshare's carousel uses: tall portrait cards (`192×256px`), background image fills
the entire card, a gradient overlay darkens the bottom half, the category name appears
in white at the bottom, the icon sits above the name.

## Fix — complete CategoryCarousel rewrite

File: `apps/web/src/components/home/CategoryCarousel.tsx`

### Card dimensions (mandatory, exact)
- Width: `192px` (`w-48`)
- Height: `256px` (`h-64`)
- Border radius: `rounded-2xl`
- These are portrait cards, taller than wide. Do NOT make them square.

### Background — since we have no photography, use rich earthy gradient backgrounds
per category. These are NOT flat solid colors — they are multi-stop gradients that
suggest the natural subject matter of each category:

```typescript
const CATEGORY_STYLES: Record<string, { gradient: string; description: string }> = {
  'crop-farming': {
    gradient: 'linear-gradient(160deg, #1b4332 0%, #2d6a4f 40%, #52b788 100%)',
    description: 'Deep green field gradient',
  },
  'livestock': {
    gradient: 'linear-gradient(160deg, #7b3f00 0%, #a0522d 45%, #d4845a 100%)',
    description: 'Warm cattle-hide brown',
  },
  'soil-health': {
    gradient: 'linear-gradient(160deg, #3d2b1f 0%, #6b4226 45%, #8b5e3c 100%)',
    description: 'Rich soil brown',
  },
  'pest-control': {
    gradient: 'linear-gradient(160deg, #1a2e1a 0%, #2c4a1e 45%, #4a7c59 100%)',
    description: 'Dark foliage green',
  },
  'irrigation': {
    gradient: 'linear-gradient(160deg, #0d3b5e 0%, #1565a0 45%, #42a5f5 100%)',
    description: 'Water/sky blue',
  },
  'agribusiness': {
    gradient: 'linear-gradient(160deg, #3b2e00 0%, #7a6010 45%, #c9a227 100%)',
    description: 'Harvest gold',
  },
  'post-harvest': {
    gradient: 'linear-gradient(160deg, #4a1942 0%, #7b2d8b 45%, #9c4dcc 100%)',
    description: 'Deep grain purple',
  },
  'farm-tech': {
    gradient: 'linear-gradient(160deg, #1a3a2a 0%, #2d6a4f 45%, #40916c 100%)',
    description: 'Tech green',
  },
  'climate': {
    gradient: 'linear-gradient(160deg, #0d4f7a 0%, #1976d2 45%, #64b5f6 100%)',
    description: 'Sky/cloud blue',
  },
  'organic': {
    gradient: 'linear-gradient(160deg, #1b4d1b 0%, #2e7d32 45%, #66bb6a 100%)',
    description: 'Organic leafy green',
  },
};
```

### Card component — exact implementation:
```tsx
function CategoryCard({ category, isVisible }: { category: Category; isVisible: boolean }) {
  const style = CATEGORY_STYLES[category.slug] ?? {
    gradient: 'linear-gradient(160deg, #1a2e1a 0%, #2E7D32 100%)',
    description: 'Default green',
  };

  return (
    <a
      href={`/courses?category=${category.slug}`}
      className={`
        relative flex-shrink-0 rounded-2xl overflow-hidden cursor-pointer
        transition-transform duration-300 hover:-translate-y-2 hover:shadow-2xl
        w-48 h-64
      `}
      style={{ background: style.gradient }}
    >
      {/* Bottom gradient overlay — darkens lower portion for text legibility */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(0deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.15) 45%, transparent 70%)',
        }}
      />

      {/* Icon — top-left area, 40% from top */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2
                      w-14 h-14 flex items-center justify-center">
        <CategoryIcon slug={category.slug} />
      </div>

      {/* Text — bottom of card */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
        <p className="text-white font-bold text-sm leading-tight">
          {category.name}
        </p>
        <p className="text-white/65 text-[11px] mt-0.5">
          {category.courseCount} courses
        </p>
      </div>
    </a>
  );
}
```

### CategoryIcon component:
```tsx
function CategoryIcon({ slug }: { slug: string }) {
  const iconProps = { size: 32, className: "text-white drop-shadow-lg", strokeWidth: 1.5 };
  const icons: Record<string, JSX.Element> = {
    'crop-farming':  <Wheat {...iconProps} />,
    'livestock':     <Beef {...iconProps} />,
    'soil-health':   <Sprout {...iconProps} />,
    'pest-control':  <Bug {...iconProps} />,
    'irrigation':    <CloudRain {...iconProps} />,
    'agribusiness':  <TrendingUp {...iconProps} />,
    'post-harvest':  <Package {...iconProps} />,
    'farm-tech':     <Smartphone {...iconProps} />,
    'climate':       <Sun {...iconProps} />,
    'organic':       <Leaf {...iconProps} />,
  };
  return icons[slug] ?? <BookOpen {...iconProps} />;
}
```

### Carousel wrapper — infinite auto-scroll:

```tsx
export function CategoryCarousel() {
  const { ref, isInView } = useInView();

  return (
    <section ref={ref as React.RefObject<HTMLElement>} className="py-10 overflow-hidden bg-white">
      {/* Section header */}
      <div className="flex items-center justify-between px-4 md:px-6 max-w-7xl mx-auto mb-6">
        <h2 className="text-2xl font-bold text-text-base">Explore by topic</h2>
      </div>

      {/* Scrolling track */}
      <div className="relative">
        <div
          className="flex gap-4 px-4"
          style={{
            width: 'max-content',
            animation: 'scrollCategories 40s linear infinite',
          }}
          onMouseEnter={e => (e.currentTarget.style.animationPlayState = 'paused')}
          onMouseLeave={e => (e.currentTarget.style.animationPlayState = 'running')}
        >
          {/* Render the 10 categories TWICE for seamless loop */}
          {[...categories, ...categories].map((cat, i) => (
            <CategoryCard
              key={`${cat.slug}-${i}`}
              category={cat}
              isVisible={isInView}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
```

### CSS keyframe for the scrolling track — add to `apps/web/src/index.css`:
```css
@keyframes scrollCategories {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
```

`-50%` is correct because we render 2× the items — translating to -50% moves exactly
one full set of cards, then the duplicate set creates the seamless loop.

### `categories` data source:
`GET /api/v1/categories` returns all 10 categories with `courseCount` included:
```typescript
interface Category {
  id: string;
  slug: string;
  name: string;
  courseCount: number;
}
```

If `courseCount` is 0 for some categories (early stage of the platform): show
`"Courses coming soon"` instead of `"0 courses"`.

---

## File summary — what to modify

| File | Change |
|---|---|
| `apps/web/src/index.css` | Add all custom `@keyframes` and `.animate-*` classes |
| `apps/web/src/hooks/useInView.ts` | Create new file |
| `apps/web/src/components/home/CategoryCarousel.tsx` | Complete rewrite per Issue 3 |
| `apps/web/src/components/home/FeaturedInstructors.tsx` | Fix card per Issue 2A |
| `apps/web/src/pages/InstructorProfilePage.tsx` | Enhance per Issue 2B |
| `apps/web/src/components/home/HeroBanner.tsx` | Add load animations |
| `apps/web/src/components/home/StatsStrip.tsx` | Add count-up + rain-drop animations |
| `apps/web/src/components/home/FeaturedCourses.tsx` | Add soil-rise animations |
| `apps/web/src/components/home/HowItWorks.tsx` | Add sprout-up + field-row animations |
| `apps/web/src/components/home/Testimonials.tsx` | Add rain-drop + leaf-sway animations |
| `apps/web/src/components/home/TeachCTA.tsx` | Add harvest-reveal animation |

Do NOT change: the Navbar, FAQ accordion, Footer, or any backend code.