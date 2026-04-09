import { X, Play, Lock, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { fetchApi } from '@/lib/api';

interface PreviewLecture {
  id: string;
  title: string;
  durationSeconds: number;
  thumbnailUrl?: string;
  isPreview: boolean;
  videoUrl?: string;
}

interface CoursePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseTitle: string;
  previewVideoUrl: string;
  previewLectures: PreviewLecture[];
}

const fmt = (s: number) =>
  `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/**
 * Attaches an HLS or direct source to a <video> element.
 * Returns a cleanup function.
 */
function attachSource(video: HTMLVideoElement, url: string): () => void {
  // Detect HLS by .m3u8 in URL
  const isHls = url.includes('.m3u8') || url.includes('m3u8');

  if (isHls && Hls.isSupported()) {
    const hls = new Hls({ enableWorker: true, lowLatencyMode: false });
    hls.loadSource(url);
    hls.attachMedia(video);
    hls.on(Hls.Events.ERROR, (_e, data) => {
      if (data.fatal) hls.destroy();
    });
    return () => hls.destroy();
  }

  // Safari native HLS or plain mp4
  video.src = url;
  return () => { video.src = ''; };
}

export function CoursePreviewModal({
  isOpen,
  onClose,
  courseTitle,
  previewVideoUrl,
  previewLectures,
}: CoursePreviewModalProps) {
  const [activeUrl, setActiveUrl] = useState('');
  const [loadingLectureId, setLoadingLectureId] = useState<string | null>(null);
  const [activeLectureId, setActiveLectureId] = useState<string | null>(null);
  const [urlCache, setUrlCache] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setError('');
      setActiveLectureId(null);

      if (previewVideoUrl) {
        setActiveUrl(previewVideoUrl);
      } else if (previewLectures.length > 0) {
        // Auto-load the first preview lecture
        loadLecture(previewLectures[0]);
      } else {
        setActiveUrl('');
      }
    } else {
      // Cleanup when modal closes
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    }
  }, [isOpen]);

  // Attach HLS/source when activeUrl changes
  useEffect(() => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    if (!activeUrl || !videoRef.current) return;

    cleanupRef.current = attachSource(videoRef.current, activeUrl);
    videoRef.current.play().catch(() => {});
  }, [activeUrl]);

  // Escape key + body overflow
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  const loadLecture = useCallback(async (lec: PreviewLecture) => {
    if (!lec.isPreview) return;

    // Check cache
    if (urlCache[lec.id]) {
      setActiveUrl(urlCache[lec.id]);
      setActiveLectureId(lec.id);
      setError('');
      return;
    }

    setLoadingLectureId(lec.id);
    setError('');
    try {
      const data = await fetchApi(`/courses/lectures/${lec.id}/preview-url`, {
        method: 'POST',
      });
      if (data.url) {
        setUrlCache(prev => ({ ...prev, [lec.id]: data.url }));
        setActiveUrl(data.url);
        setActiveLectureId(lec.id);
      } else {
        setError('No preview URL available');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load preview');
    } finally {
      setLoadingLectureId(null);
    }
  }, [urlCache]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-[#1c1c1e] w-full sm:max-w-2xl sm:rounded-xl rounded-none
                    max-h-[100dvh] sm:max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
          <div>
            <p className="text-white/50 text-xs uppercase tracking-wider mb-0.5">
              Course Preview
            </p>
            <p className="text-white font-semibold text-base leading-snug line-clamp-1">
              {courseTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close preview"
            className="text-white/50 hover:text-white transition-colors ml-4 mt-0.5 flex-shrink-0
                       w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        {/* Video */}
        <div className="bg-black flex-shrink-0">
          {activeUrl ? (
            <video
              ref={videoRef}
              controls
              autoPlay
              playsInline
              crossOrigin="anonymous"
              className="w-full aspect-video bg-black"
            />
          ) : (
            <div className="w-full aspect-video flex items-center justify-center">
              {loadingLectureId ? (
                <Loader2 size={24} className="text-white/50 animate-spin" />
              ) : error ? (
                <p className="text-white/50 text-sm px-4 text-center">{error}</p>
              ) : previewLectures.length > 0 ? (
                <p className="text-white/50 text-sm">Select a lecture to preview</p>
              ) : (
                <p className="text-white/50 text-sm">No preview available</p>
              )}
            </div>
          )}
        </div>

        {/* Lecture list */}
        {previewLectures.length > 0 && (
          <div className="flex-1 overflow-y-auto">
            <p className="text-white/70 text-sm px-5 pt-4 pb-2 font-medium">
              Free Sample Videos:
            </p>
            {previewLectures.map((lec) => {
              const isLoading = loadingLectureId === lec.id;
              const isActive = activeLectureId === lec.id;
              return (
                <div
                  key={lec.id}
                  className={`flex items-center gap-3 px-5 py-3 border-b border-white/5
                              cursor-pointer transition-colors duration-150
                              ${isActive ? 'bg-white/10' : 'hover:bg-white/5'}`}
                  onClick={() => loadLecture(lec)}
                >
                  {/* Thumbnail */}
                  <div className="w-14 h-10 bg-white/10 rounded overflow-hidden flex-shrink-0 relative">
                    <div className="w-full h-full flex items-center justify-center">
                      {isLoading ? (
                        <Loader2 size={14} className="text-white/60 animate-spin" />
                      ) : (
                        <Play size={12} className={isActive ? 'text-white' : 'text-white/40'} />
                      )}
                    </div>
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug truncate ${isActive ? 'text-white font-medium' : 'text-white'}`}>
                      {lec.title}
                    </p>
                    <p className="text-white/40 text-xs mt-0.5">
                      {fmt(lec.durationSeconds)}
                    </p>
                  </div>
                  {/* Icon */}
                  {lec.isPreview ? (
                    <Play size={13} className="text-white/30 flex-shrink-0" />
                  ) : (
                    <Lock size={13} className="text-white/20 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
