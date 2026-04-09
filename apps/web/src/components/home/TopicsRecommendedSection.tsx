import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';

export function TopicsRecommendedSection() {
  const [topics, setTopics] = useState<string[]>([]);

  useEffect(() => {
    fetchApi('/farmer/recommended-topics?limit=10')
      .then(res => setTopics(res.topics || []))
      .catch(() => {});
  }, []);

  if (topics.length === 0) return null;

  return (
    <div className="px-4 md:px-6 lg:px-10 py-6 border-t border-gray-100">
      <h2 className="text-xl font-bold text-text-base mb-4">Topics recommended for you</h2>

      <div className="grid grid-rows-2 grid-flow-col auto-cols-max gap-3 overflow-x-auto scrollbar-hide pb-2">
        {topics.map(topic => (
          <a
            key={topic}
            href={`/search?q=${encodeURIComponent(topic)}`}
            className="border border-gray-300 text-text-base text-sm px-4 py-2.5 rounded hover:border-primary hover:text-primary transition-colors whitespace-nowrap block"
          >
            {topic}
          </a>
        ))}
      </div>
    </div>
  );
}
