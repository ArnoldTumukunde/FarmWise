import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchApi } from '../lib/api';

export default function StaticPage() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<{ title: string; content: string; metaTitle?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetchApi(`/pages/${slug}`)
      .then((data) => {
        setPage(data.page);
        if (data.page?.metaTitle) document.title = data.page.metaTitle;
        else if (data.page?.title) document.title = `${data.page.title} — FarmWise`;
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 animate-pulse">
        <div className="h-8 w-64 bg-[#2E7D32]/10 rounded mb-6" />
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-4 bg-[#2E7D32]/5 rounded" style={{ width: `${70 + Math.random() * 30}%` }} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-[#1B2B1B]">Page Not Found</h1>
        <p className="text-[#5A6E5A] mt-2">The page you're looking for doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-[#1B2B1B] mb-8">{page.title}</h1>
      <div
        className="prose prose-green max-w-none text-[#1B2B1B]"
        dangerouslySetInnerHTML={{ __html: page.content }}
      />
    </div>
  );
}
