import { useEffect, useState, useRef } from 'react';

const instructors = [
  { name: 'Dr. Sarah Akello', title: 'Soil Scientist, Makerere University', initials: 'SA', color: 'bg-emerald-600' },
  { name: 'John Mwangi', title: 'Livestock Management Expert', initials: 'JM', color: 'bg-amber-600' },
  { name: 'Grace Nakamya', title: 'Crop Science Researcher', initials: 'GN', color: 'bg-blue-600' },
  { name: 'Emmanuel Okoth', title: 'Agribusiness Consultant', initials: 'EO', color: 'bg-purple-600' },
  { name: 'Fatuma Hassan', title: 'Organic Farming Specialist', initials: 'FH', color: 'bg-rose-600' },
  { name: 'David Ssempala', title: 'Extension Officer, NAADS', initials: 'DS', color: 'bg-teal-600' },
  { name: 'Alice Chemutai', title: 'Post-Harvest Technology Expert', initials: 'AC', color: 'bg-orange-600' },
  { name: 'Peter Ochieng', title: 'Irrigation & Water Management', initials: 'PO', color: 'bg-cyan-600' },
];

export function FeaturedInstructors() {
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="max-w-7xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-[#1B2B1B]">
          Learn from Agricultural Experts
        </h2>
        <p className="text-[#5A6E5A] max-w-2xl mx-auto mt-3">
          FarmWise instructors are extension officers, scientists, and experienced
          farmers who want to share what actually works.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {instructors.map((instructor, index) => (
          <div
            key={instructor.name}
            className="group cursor-pointer hover:scale-105 hover:shadow-lg transition-all duration-200 rounded-xl"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(20px)',
              transition: `opacity 0.5s ease-out ${index * 0.08}s, transform 0.5s ease-out ${index * 0.08}s`,
            }}
          >
            <div
              className={`aspect-square rounded-xl ${instructor.color} flex items-center justify-center`}
            >
              <span className="text-white text-3xl md:text-4xl font-bold select-none">
                {instructor.initials}
              </span>
            </div>
            <p className="text-xs font-bold text-[#F57F17] tracking-widest uppercase mt-3">
              Meet
            </p>
            <p className="text-base font-semibold text-[#1B2B1B]">
              {instructor.name}
            </p>
            <p className="text-sm text-[#5A6E5A]">{instructor.title}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
