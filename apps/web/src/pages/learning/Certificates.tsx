import { useState, useEffect } from 'react';
import { fetchApi, API_URL } from '../../lib/api';
import { cloudinaryImageUrl } from '../../lib/utils';
import { Award, Download, Sprout, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Certificate {
  id: string;
  courseId: string;
  courseTitle: string;
  courseThumbnailPublicId: string | null;
  issuedAt: string;
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-[#2E7D32]/10 overflow-hidden animate-pulse">
      <div className="aspect-video bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-100 rounded w-1/2" />
        <div className="h-10 bg-gray-200 rounded-lg w-full mt-2" />
      </div>
    </div>
  );
}

export default function Certificates() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchApi('/community/certificates')
      .then((res) => {
        const certs = res.certificates || res.data || [];
        setCertificates(
          certs.map((c: any) => ({
            id: c.id || c.courseId,
            courseId: c.courseId || c.course?.id,
            courseTitle: c.courseTitle || c.course?.title || 'Untitled Course',
            courseThumbnailPublicId:
              c.courseThumbnailPublicId || c.course?.thumbnailPublicId || null,
            issuedAt: c.issuedAt || c.completedAt || c.createdAt,
          }))
        );
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async (cert: Certificate) => {
    setDownloadingId(cert.courseId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${API_URL}/community/courses/${cert.courseId}/certificate/download`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
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
      return new Date(dateStr).toLocaleDateString('en-UG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF5]">
      {/* Header */}
      <div className="bg-[#2E7D32] pt-10 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <Award size={28} className="text-white/80" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">My Certificates</h1>
              {!loading && certificates.length > 0 && (
                <p className="text-white/70 text-sm mt-1">
                  {certificates.length} certificate{certificates.length !== 1 ? 's' : ''} earned
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-10 relative z-10 pb-20">
        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Certificates Grid */}
        {!loading && certificates.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="bg-white rounded-xl border border-[#2E7D32]/10 overflow-hidden hover:shadow-md transition-shadow"
              >
                {cert.courseThumbnailPublicId ? (
                  <img
                    src={cloudinaryImageUrl(cert.courseThumbnailPublicId, 400, 225)}
                    alt={cert.courseTitle}
                    className="w-full aspect-video object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full aspect-video bg-gradient-to-br from-[#2E7D32]/20 to-[#F57F17]/10 flex items-center justify-center">
                    <Award size={48} className="text-[#F57F17]/40" />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-bold text-[#1B2B1B] line-clamp-2 leading-snug text-sm">
                    {cert.courseTitle}
                  </h3>
                  <p className="text-xs text-[#5A6E5A] mt-1">
                    Issued {formatDate(cert.issuedAt)}
                  </p>
                  <button
                    onClick={() => handleDownload(cert)}
                    disabled={downloadingId === cert.courseId}
                    className="mt-3 w-full inline-flex items-center justify-center gap-2 py-2.5 bg-[#2E7D32]/10 text-[#2E7D32] font-medium rounded-lg hover:bg-[#2E7D32] hover:text-white transition-colors text-sm focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2 disabled:opacity-50"
                  >
                    {downloadingId === cert.courseId ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download size={16} />
                        Download PDF
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && certificates.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-[#2E7D32]/10 max-w-lg mx-auto">
            <div className="w-20 h-20 mx-auto bg-[#F57F17]/10 rounded-full flex items-center justify-center mb-6">
              <Award size={40} className="text-[#F57F17]" />
            </div>
            <h2 className="text-xl font-bold text-[#1B2B1B] mb-2">No certificates yet</h2>
            <p className="text-[#5A6E5A] mb-6 max-w-sm mx-auto text-sm px-4">
              Complete a course to earn your first certificate!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
