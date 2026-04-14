import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import type { Level, FragmentLoaderContext, LoaderCallbacks, LoaderConfiguration, LoaderStats } from 'hls.js';
import { Settings, Loader2, AlertTriangle } from 'lucide-react';
import { useOfflineStore } from '../../offline/offlineStore';
import { getDownloadStatus, getDecryptedSegment } from '../../offline/downloadManager';

import { fetchApi } from '../../lib/api';

/**
 * Custom HLS.js fragment loader that intercepts offline-seg:// URIs
 * and serves decrypted segments from IndexedDB.
 */
function createOfflineLoader(DefaultLoader: any) {
  return class OfflineFragLoader {
    private defaultLoader: any;

    constructor(config: any) {
      this.defaultLoader = new DefaultLoader(config);
    }

    load(context: FragmentLoaderContext, config: LoaderConfiguration, callbacks: LoaderCallbacks<FragmentLoaderContext>) {
      const url = context.url;
      if (url.startsWith('offline-seg://')) {
        // Parse: offline-seg://lectureId/segIndex
        const parts = url.replace('offline-seg://', '').split('/');
        const lectureId = parts[0];
        const segIndex = parseInt(parts[1], 10);

        getDecryptedSegment(lectureId, segIndex).then(data => {
          const now = performance.now();
          const mkStats = (size: number) => ({
            aborted: false,
            loaded: size,
            total: size,
            chunkCount: 1,
            loading: { start: now, first: now, end: now },
            parsing: { start: 0, end: 0 },
            buffering: { start: 0, first: 0, end: 0 },
            retry: 0,
            bwEstimate: 0,
          }) as unknown as LoaderStats;

          if (data) {
            callbacks.onSuccess({ data, url }, mkStats(data.byteLength), context, null);
          } else {
            callbacks.onError({ code: 404, text: 'Segment not found' }, context, null, mkStats(0));
          }
        }).catch(err => {
          callbacks.onError({ code: 500, text: err.message }, context, null, null as any);
        });
        return;
      }
      // Online segments — use default loader
      this.defaultLoader.load(context, config, callbacks);
    }

    abort() { this.defaultLoader?.abort?.(); }
    destroy() { this.defaultLoader?.destroy?.(); }
  };
}

interface HlsPlayerProps {
  lectureId: string;
  onEnded?: () => void;
  onProgress?: (seconds: number) => void;
}

/** Map an HLS level height to a human-readable label. */
function resolutionLabel(level: Level): string {
  const h = level.height;
  if (h >= 1080) return '1080p';
  if (h >= 720) return '720p';
  if (h >= 480) return '480p';
  if (h >= 360) return '360p';
  return `${h}p`;
}

export function HlsPlayer({ lectureId, onEnded, onProgress }: HlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const isOffline = useOfflineStore(s => s.isOffline);

  const [isBuffering, setIsBuffering] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [levels, setLevels] = useState<Level[]>([]);
  const [currentLevel, setCurrentLevel] = useState(-1); // -1 = Auto
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  const qualityMenuRef = useRef<HTMLDivElement>(null);

  // Close quality menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        qualityMenuRef.current &&
        !qualityMenuRef.current.contains(e.target as Node)
      ) {
        setShowQualityMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Quality selection handler
  const selectLevel = useCallback((levelIndex: number) => {
    const hls = hlsRef.current;
    if (!hls) return;
    hls.currentLevel = levelIndex; // -1 = auto
    setCurrentLevel(levelIndex);
    setShowQualityMenu(false);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls;
    setError(null);
    setIsBuffering(true);
    setLevels([]);
    setCurrentLevel(-1);

    const initPlayer = async () => {
      const status = await getDownloadStatus(lectureId);
      let manifestUrl = '';

      if (status?.status === 'DOWNLOADED' && status.stableManifestKey) {
        manifestUrl = status.stableManifestKey;
      } else if (!isOffline) {
        // Fetch 5-minute signed URL for online playback (respects Hard Constraint 1)
        try {
           const { url } = await fetchApi(`/learn/lectures/${lectureId}/download-url`, { method: 'POST' });
           manifestUrl = url;
        } catch (e) {
           console.error("Failed to fetch signed media url", e);
           setError('Unable to load video. Please check your connection and try again.');
           setIsBuffering(false);
           return;
        }
      } else {
        console.error("User is offline and video is not downloaded");
        setError('You are offline and this video has not been downloaded.');
        setIsBuffering(false);
        return;
      }

      if (Hls.isSupported()) {
        const isOfflinePlayback = status?.status === 'DOWNLOADED' && status.encrypted;
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          ...(isOfflinePlayback ? { fLoader: createOfflineLoader((Hls as any).DefaultConfig.loader) as any } : {}),
        });
        hlsRef.current = hls;

        hls.loadSource(manifestUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
          setLevels(hls.levels);
          setCurrentLevel(hls.currentLevel);
          // data.levels is available here as well
          void data;
        });

        hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
          setCurrentLevel(data.level);
        });

        hls.on(Hls.Events.ERROR, function (_event, data) {
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  console.error("fatal network error encountered, try to recover");
                  hls.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  console.error("fatal media error encountered, try to recover");
                  hls.recoverMediaError();
                  break;
                default:
                  hls.destroy();
                  setError('Video playback failed. Please try refreshing the page.');
                  setIsBuffering(false);
                  break;
              }
            }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari native HLS — no quality selector available
        video.src = manifestUrl;
      }
    };

    initPlayer();

    // Buffering / loading state listeners
    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => setIsBuffering(false);
    const handleCanPlay = () => setIsBuffering(false);

    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('canplay', handleCanPlay);

    const updateProgress = () => {
      if (video && onProgress) {
        onProgress(video.currentTime);
      }
    };

    video.addEventListener('timeupdate', updateProgress);
    if (onEnded) video.addEventListener('ended', onEnded);

    return () => {
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('timeupdate', updateProgress);
      if (onEnded) video.removeEventListener('ended', onEnded);
      if (hls) {
        hls.destroy();
      }
      hlsRef.current = null;
    };
  }, [lectureId, isOffline]);

  // Error state
  if (error) {
    return (
      <div className="relative w-full aspect-video bg-[#1A2E1A] flex flex-col items-center justify-center rounded-lg">
        <AlertTriangle className="w-10 h-10 text-[#5A6E5A] mb-3" />
        <p className="text-[#5A6E5A] text-sm text-center max-w-xs px-4">
          {error}
        </p>
        <button
          type="button"
          onClick={() => setError(null)}
          className="mt-4 px-4 py-1.5 text-sm rounded bg-[#2E7D32] text-white hover:bg-[#256828] transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden group">
      {/* Video element */}
      <video
        ref={videoRef}
        className="w-full h-full bg-black focus:outline-none"
        controls
        crossOrigin="anonymous"
        playsInline
      />

      {/* Loading spinner overlay */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/30">
          <Loader2 className="w-10 h-10 text-white animate-spin" />
        </div>
      )}

      {/* Quality selector — visible when HLS levels are available */}
      {levels.length > 1 && (
        <div
          ref={qualityMenuRef}
          className="absolute bottom-16 right-2 z-20"
        >
          <button
            type="button"
            onClick={() => setShowQualityMenu(prev => !prev)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-black/70 hover:bg-black/90 text-white text-xs font-medium transition-colors backdrop-blur"
            aria-label="Video quality"
          >
            <Settings className="w-3.5 h-3.5" />
            {currentLevel === -1 ? 'Auto' : levels[currentLevel] ? resolutionLabel(levels[currentLevel]) : 'Auto'}
          </button>

          {showQualityMenu && (
            <div className="absolute bottom-10 right-0 min-w-[140px] bg-[#1A2E1A]/95 backdrop-blur rounded-lg shadow-lg border border-[#5A6E5A]/20 py-1 text-sm">
              <button
                type="button"
                onClick={() => selectLevel(-1)}
                className={`w-full text-left px-3 py-2 hover:bg-[#2E7D32]/30 transition-colors ${
                  currentLevel === -1 ? 'text-[#2E7D32] font-medium' : 'text-white'
                }`}
              >
                Auto
              </button>

              {[...levels]
                .map((level, index) => ({ level, index }))
                .sort((a, b) => b.level.height - a.level.height)
                .map(({ level, index }) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => selectLevel(index)}
                    className={`w-full text-left px-3 py-2 hover:bg-[#2E7D32]/30 transition-colors ${
                      currentLevel === index ? 'text-[#2E7D32] font-medium' : 'text-white'
                    }`}
                  >
                    {resolutionLabel(level)}
                  </button>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
