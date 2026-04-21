/**
 * Cloudinary upload helper with progress tracking.
 *
 * `fetch` has no upload progress API in browsers. XHR does.
 * Returns a Promise that resolves to the Cloudinary response JSON.
 */

export interface UploadProgress {
  loaded: number;          // bytes uploaded
  total: number;           // total bytes
  percent: number;         // 0-100
  etaSeconds: number | null; // estimated time remaining, null if unknown
  bytesPerSec: number;     // current upload speed
}

export interface UploadOptions {
  cloudName: string;
  resourceType: 'image' | 'video' | 'raw' | 'auto';
  formData: FormData;      // already populated with file + signature fields
  onProgress?: (p: UploadProgress) => void;
  signal?: AbortSignal;    // optional cancel
}

export function uploadToCloudinary(opts: UploadOptions): Promise<any> {
  const { cloudName, resourceType, formData, onProgress, signal } = opts;
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const startedAt = Date.now();

    xhr.open('POST', url);

    xhr.upload.onprogress = (e) => {
      if (!e.lengthComputable || !onProgress) return;
      const elapsed = (Date.now() - startedAt) / 1000;
      const bytesPerSec = elapsed > 0 ? e.loaded / elapsed : 0;
      const remaining = e.total - e.loaded;
      const etaSeconds = bytesPerSec > 0 ? Math.ceil(remaining / bytesPerSec) : null;
      onProgress({
        loaded: e.loaded,
        total: e.total,
        percent: Math.round((e.loaded / e.total) * 100),
        etaSeconds,
        bytesPerSec,
      });
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          reject(new Error('Invalid Cloudinary response'));
        }
      } else {
        let msg = `Upload failed (${xhr.status})`;
        try {
          const j = JSON.parse(xhr.responseText);
          if (j?.error?.message) msg = j.error.message;
        } catch { /* ignore */ }
        reject(new Error(msg));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.onabort = () => reject(new Error('Upload cancelled'));

    if (signal) {
      if (signal.aborted) { xhr.abort(); return; }
      signal.addEventListener('abort', () => xhr.abort());
    }

    xhr.send(formData);
  });
}

/** Format bytes to human-readable string (KB/MB/GB). */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

/** Format seconds to "2m 15s" or "45s". */
export function formatEta(seconds: number | null): string {
  if (seconds == null || !isFinite(seconds)) return '—';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}
