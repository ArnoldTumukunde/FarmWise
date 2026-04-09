import { Check } from 'lucide-react';

export function WhatYouWillLearnSection({ outcomes }: { outcomes: string[] }) {
  if (!outcomes?.length) return null;

  return (
    <section className="py-10 border-b border-gray-100">
      <h2 className="text-xl lg:text-2xl font-bold text-text-base mb-6">
        What you'll learn
      </h2>
      <div className="border border-gray-200 rounded-lg p-6 bg-white">
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
          {outcomes.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <Check size={16} className="text-primary flex-shrink-0 mt-0.5" />
              <span className="text-sm text-text-base leading-relaxed">
                {item}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
