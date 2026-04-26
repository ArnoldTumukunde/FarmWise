import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { useInView } from '@/hooks/useInView';
import { anim } from '@/lib/animations';

/* ── Types ── */

interface HomepageInstructor {
  id: string;
  name: string;
  title: string;
  avatarUrl: string | null;
  courseCount: number;
  studentCount: number;
  averageRating: number;
}

/* ── Earthy gradient palette ── */

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
  const index = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % GRADIENTS.length;
  return GRADIENTS[index];
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();
}

/* ── Fallback instructors (used if API returns nothing) ── */

// Photos: Unsplash — free for commercial use, no attribution required.
// https://unsplash.com/license
const FALLBACK_INSTRUCTORS: HomepageInstructor[] = [
  { id: 'f1', name: 'Dr. Sarah Akello',  title: 'Soil Scientist, Makerere University',     avatarUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&h=600&fit=crop&crop=faces&q=80', courseCount: 5, studentCount: 2341, averageRating: 4.8 },
  { id: 'f2', name: 'John Mwangi',       title: 'Livestock Management Expert',             avatarUrl: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=600&h=600&fit=crop&crop=faces&q=80', courseCount: 3, studentCount: 1856, averageRating: 4.7 },
  { id: 'f3', name: 'Grace Nakamya',     title: 'Crop Science Researcher',                 avatarUrl: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=600&h=600&fit=crop&crop=faces&q=80', courseCount: 4, studentCount: 1420, averageRating: 4.9 },
  { id: 'f4', name: 'Emmanuel Okoth',    title: 'Agribusiness Consultant',                 avatarUrl: 'https://images.unsplash.com/photo-1542178243-bc20204b769f?w=600&h=600&fit=crop&crop=faces&q=80', courseCount: 2, studentCount: 980,  averageRating: 4.6 },
  { id: 'f5', name: 'Fatuma Hassan',     title: 'Organic Farming Specialist',              avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&h=600&fit=crop&crop=faces&q=80', courseCount: 3, studentCount: 1200, averageRating: 4.8 },
  { id: 'f6', name: 'David Ssempala',    title: 'Extension Officer, NAADS',                avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=600&fit=crop&crop=faces&q=80', courseCount: 6, studentCount: 3100, averageRating: 4.5 },
  { id: 'f7', name: 'Alice Chemutai',    title: 'Post-Harvest Technology Expert',          avatarUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&h=600&fit=crop&crop=faces&q=80', courseCount: 2, studentCount: 760,  averageRating: 4.7 },
  { id: 'f8', name: 'Peter Ochieng',     title: 'Irrigation & Water Management',           avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&h=600&fit=crop&crop=faces&q=80', courseCount: 4, studentCount: 1650, averageRating: 4.6 },
];

/* ── InstructorCard ── */

function InstructorCard({ instructor, isVisible, index }: {
  instructor: HomepageInstructor;
  isVisible: boolean;
  index: number;
}) {
  // Stagger: row 1 (0-3) starts at 0, row 2 (4-7) starts at 200ms
  const rowOffset = index >= 4 ? 200 : 0;
  const delay = rowOffset + (index % 4) * 80;

  return (
    <a
      href={`/instructors/${instructor.id}`}
      className="block group cursor-pointer"
      style={anim.soilRise(isVisible, delay)}
      aria-label={`View ${instructor.name}'s profile`}
    >
      {/* Photo / avatar area */}
      <div className="aspect-square w-full rounded-xl overflow-hidden relative mb-3">
        {instructor.avatarUrl ? (
          <img
            src={instructor.avatarUrl}
            alt={instructor.name}
            className="w-full h-full object-cover transition-transform duration-300
                       group-hover:scale-105"
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center
                          ${getInstructorGradient(instructor.id)}`}>
            <span className="text-white font-bold text-3xl select-none">
              {getInitials(instructor.name)}
            </span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-[#1A2E1A]/70 opacity-0 group-hover:opacity-100
                        transition-opacity duration-200 flex items-center justify-center">
          <span className="text-white text-sm font-semibold px-4 py-2 border border-white/40
                           rounded-full">
            View profile &rarr;
          </span>
        </div>
      </div>

      {/* Text below */}
      <div className="px-0.5">
        <p className="text-[10px] font-bold text-[#F57F17] tracking-widest uppercase mb-0.5">
          Meet
        </p>
        <p className="text-sm font-semibold text-[#1B2B1B] leading-snug line-clamp-1">
          {instructor.name}
        </p>
        <p className="text-xs text-[#5A6E5A] leading-snug line-clamp-2 mt-0.5">
          {instructor.title}
        </p>
      </div>
    </a>
  );
}

/* ── Main section ── */

export function FeaturedInstructors() {
  const { ref, isInView } = useInView({ threshold: 0.1 });
  const [instructors, setInstructors] = useState<HomepageInstructor[]>(FALLBACK_INSTRUCTORS);

  useEffect(() => {
    fetchApi('/instructor/featured?limit=8')
      .then((data: any) => {
        const list = Array.isArray(data) ? data : data.instructors ?? data.data ?? [];
        if (list.length > 0) {
          setInstructors(list.slice(0, 8).map((i: any) => ({
            id: i.id,
            name: i.name || i.profile?.displayName || 'Instructor',
            title: i.title || i.profile?.headline || 'Agricultural Expert',
            avatarUrl: i.avatarUrl || null,
            courseCount: i.courseCount ?? i._count?.courses ?? 0,
            studentCount: i.studentCount ?? 0,
            averageRating: i.averageRating ?? 0,
          })));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section ref={ref} className="max-w-7xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-[#1B2B1B]">
          Learn from Agricultural Experts
        </h2>
        <p className="text-[#5A6E5A] max-w-2xl mx-auto mt-3">
          AAN Academy instructors are extension officers, scientists, and experienced
          farmers who want to share what actually works.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 md:gap-6">
        {instructors.slice(0, 8).map((instructor, index) => (
          <InstructorCard
            key={instructor.id}
            instructor={instructor}
            isVisible={isInView}
            index={index}
          />
        ))}
      </div>
    </section>
  );
}
