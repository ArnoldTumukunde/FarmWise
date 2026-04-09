export function RequirementsSection({
  requirements,
}: {
  requirements: string[];
}) {
  if (!requirements?.length) return null;

  return (
    <section className="py-10 border-b border-gray-100">
      <h2 className="text-xl lg:text-2xl font-bold text-text-base mb-5">
        Requirements
      </h2>
      <ul className="space-y-2">
        {requirements.map((req, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-sm text-text-base leading-relaxed"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-text-base flex-shrink-0 mt-2" />
            {req}
          </li>
        ))}
      </ul>
    </section>
  );
}
