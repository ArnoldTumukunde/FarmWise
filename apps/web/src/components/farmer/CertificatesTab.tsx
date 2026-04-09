import { useState, useEffect } from 'react';
import { fetchApi, API_URL } from '@/lib/api';
import { cloudinaryImageUrl } from '@/lib/utils';
import { Award, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Certificate {
  id: string;
  courseId: string;
  courseTitle: string;
  courseThumbnailPublicId: string | null;
  issuedAt: string;
}

export function CertificatesTab() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchApi('/community/certificates')
      .then(res => {
        const certs = res.certificates || res.data || [];
        setCertificates(
          certs.map((c: any) => ({
            id: c.id || c.courseId,
            courseId: c.courseId || c.course?.id,
            courseTitle: c.courseTitle || c.course?.title || 'Untitled Course',
            courseThumbnailPublicId: c.courseThumbnailPublicId || c.course?.thumbnailPublicId || null,
            issuedAt: c.issuedAt || c.completedAt || c.createdAt,
          }))
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async (cert: Certificate) => {
    setDownloadingId(cert.courseId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${API_URL}/community/courses/${cert.courseId}/certificate/download`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${cert.courseTitle.replace(/[^a-zA-Z0-9]/g, '_')}_Certificate.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Certificate downloaded');
    } catch (err: any) {
      toast.error(err.message || 'Failed to download certificate');
    } finally {
      setDownloadingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-UG', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch { return dateStr; }
  };

  if (loading) {
    return (
      <div className="px-4 md:px-6 lg:px-10 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="aspect-video bg-gray-200 rounded-lg" />
              <div className="mt-3 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
                <div className="h-10 bg-gray-200 rounded-lg w-full mt-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (certificates.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Award size={28} className="text-accent" />
        </div>
        <h3 className="text-lg font-bold text-text-base mb-2">No certificates yet</h3>
        <p className="text-sm text-text-muted mb-6 max-w-xs mx-auto">
          Complete a course to earn your first certificate!
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-6 lg:px-10 py-6">
      <p className="text-sm font-medium text-text-base mb-4">
        {certificates.length} certificate{certificates.length !== 1 ? 's' : ''} earned
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {certificates.map(cert => (
          <div key={cert.id} className="bg-white rounded-lg border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            <div className="aspect-video bg-gray-100 overflow-hidden">
              {cert.courseThumbnailPublicId ? (
                <img
                  src={cloudinaryImageUrl(cert.courseThumbnailPublicId, 480, 270)}
                  alt={cert.courseTitle}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center">
                  <Award size={36} className="text-accent/40" />
                </div>
              )}
            </div>
            <div className="p-3">
              <h3 className="text-sm font-semibold text-text-base line-clamp-2 leading-snug">
                {cert.courseTitle}
              </h3>
              <p className="text-xs text-text-muted mt-1">Issued {formatDate(cert.issuedAt)}</p>
              <button
                onClick={() => handleDownload(cert)}
                disabled={downloadingId === cert.courseId}
                className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 bg-primary/10 text-primary font-medium rounded-lg hover:bg-primary hover:text-white transition-colors text-xs disabled:opacity-50"
              >
                {downloadingId === cert.courseId ? (
                  <><Loader2 size={14} className="animate-spin" /> Downloading...</>
                ) : (
                  <><Download size={14} /> Download PDF</>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
