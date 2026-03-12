import { useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { useOfflineStore } from '../../offline/offlineStore';
import { getDownloadStatus } from '../../offline/downloadManager';

import { fetchApi } from '../../lib/api';

interface HlsPlayerProps {
  lectureId: string;
  onEnded?: () => void;
  onProgress?: (seconds: number) => void;
}

export function HlsPlayer({ lectureId, onEnded, onProgress }: HlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isOffline = useOfflineStore(s => s.isOffline);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls;

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
           return;
        }
      } else {
        console.error("User is offline and video is not downloaded");
        return;
      }

      if (Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
        });

        hls.loadSource(manifestUrl);
        hls.attachMedia(video);
        
        hls.on(Hls.Events.ERROR, function (event, data) {
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
                  break;
              }
            }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari native HLS
        video.src = manifestUrl;
      }
    };

    initPlayer();

    const updateProgress = () => {
      if (video && onProgress) {
        onProgress(video.currentTime);
      }
    };

    video.addEventListener('timeupdate', updateProgress);
    if (onEnded) video.addEventListener('ended', onEnded);

    return () => {
      video.removeEventListener('timeupdate', updateProgress);
      if (onEnded) video.removeEventListener('ended', onEnded);
      if (hls) {
        hls.destroy();
      }
    };
  }, [lectureId, isOffline]);

  return (
    <video
      ref={videoRef}
      className="w-full aspect-video bg-black focus:outline-none"
      controls
      crossOrigin="anonymous"
      playsInline
    />
  );
}
