interface Sponsor {
  name: string;
  logo: string;
  url?: string;
}

const sponsors: Sponsor[] = [
  { name: 'Africa Coffee Academy', logo: '/sponsors/aca_logo.png', url: 'https://africacoffeeacademy.com' },
  { name: 'Famunera', logo: '/sponsors/famunera_logo.png', url: 'https://famunera.com' },
];

export function Sponsors() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-10" aria-labelledby="sponsors-heading">
      <h2
        id="sponsors-heading"
        className="text-[11px] font-semibold text-[#5A6E5A]/70 uppercase tracking-[0.15em] text-center mb-6"
      >
        Trusted by partners
      </h2>
      <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 md:gap-x-14">
        {sponsors.map((s) => {
          const Img = (
            <img
              src={s.logo}
              alt={s.name}
              loading="lazy"
              className="h-8 md:h-10 w-auto object-contain grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-200"
            />
          );
          return s.url ? (
            <a
              key={s.name}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              aria-label={s.name}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2 rounded-sm"
            >
              {Img}
            </a>
          ) : (
            <span key={s.name} aria-label={s.name}>{Img}</span>
          );
        })}
      </div>
    </section>
  );
}
