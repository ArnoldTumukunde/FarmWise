/**
 * Cloudinary upload helper with progress tracking + chunked upload.
 *
 * `fetch` has no upload progress API in browsers — XHR does.
 * For files > CHUNK_THRESHOLD, uses Cloudinary's chunked upload protocol:
 *   https://cloudinary.com/documentation/upload_images#chunked_asset_upload
 *
 * Chunks are POSTed with `X-Unique-Upload-Id` (same for all chunks of a file)
 * and `Content-Range: bytes START-END/TOTAL` headers. Last chunk returns the
 * final asset response. Progress aggregates across chunks.
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
  formData: FormData;      // pre-populated with file + signature fields
  onProgress?: (p: UploadProgress) => void;
  signal?: AbortSignal;
  chunkSize?: number;      // bytes per chunk (default 20MB)
}

// Files larger than this get chunked. Single POST often fails on flaky networks
// or hits proxy/browser limits above ~100MB.
const CHUNK_THRESHOLD = 20 * 1024 * 1024;   // 20 MB
const DEFAULT_CHUNK_SIZE = 20 * 1024 * 1024; // 20 MB

function uuid(): string {
  // Prefer crypto.randomUUID when available
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return (crypto as any).randomUUID();
  }
  return `xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx`.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Extract the File from a FormData for chunking. */
function extractFile(formData: FormData): File | null {
  const f = formData.get('file');
  return f instanceof File ? f : null;
}

function makeProgressReporter(startedAt: number, total: number, onProgress?: (p: UploadProgress) => void) {
  return (loaded: number) => {
    if (!onProgress) return;
    const elapsed = (Date.now() - startedAt) / 1000;
    const bytesPerSec = elapsed > 0 ? loaded / elapsed : 0;
    const remaining = total - loaded;
    const etaSeconds = bytesPerSec > 0 ? Math.ceil(remaining / bytesPerSec) : null;
    onProgress({
      loaded,
      total,
      percent: Math.round((loaded / total) * 100),
      etaSeconds,
      bytesPerSec,
    });
  };
}

/** Single-shot upload (for small files). */
function uploadSingle(opts: UploadOptions, url: string): Promise<any> {
  const { formData, onProgress, signal } = opts;
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const startedAt = Date.now();

    xhr.open('POST', url);

    xhr.upload.onprogress = (e) => {
      if (!e.lengthComputable) return;
      const r = makeProgressReporter(startedAt, e.total, onProgress);
      r(e.loaded);
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve(JSON.parse(xhr.responseText)); }
        catch { reject(new Error('Invalid Cloudinary response')); }
      } else {
        let msg = `Upload failed (${xhr.status})`;
        try { msg = JSON.parse(xhr.responseText)?.error?.message || msg; } catch { /* ignore */ }
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

/** Chunked upload using Cloudinary's X-Unique-Upload-Id + Content-Range protocol. */
async function uploadChunked(opts: UploadOptions, url: string, file: File): Promise<any> {
  const { formData: baseFormData, onProgress, signal } = opts;
  const chunkSize = opts.chunkSize || DEFAULT_CHUNK_SIZE;
  const total = file.size;
  const uploadId = uuid();
  const startedAt = Date.now();
  let uploadedBytes = 0;
  const report = makeProgressReporter(startedAt, total, onProgress);

  // Upload each chunk with retries
  const MAX_RETRIES = 3;
  let lastResponse: any = null;

  for (let start = 0; start < total; start += chunkSize) {
    if (signal?.aborted) throw new Error('Upload cancelled');

    const end = Math.min(start + chunkSize, total);
    const blob = file.slice(start, end);

    // Build per-chunk FormData — clone signature fields from baseFormData
    const chunkForm = new FormData();
    baseFormData.forEach((v, k) => { if (k !== 'file') chunkForm.append(k, v as any); });
    chunkForm.append('file', blob, file.name);

    const chunkIdx = Math.floor(start / chunkSize);
    const totalChunks = Math.ceil(total / chunkSize);
    console.log(`[upload] chunk ${chunkIdx + 1}/${totalChunks} bytes ${start}-${end - 1}/${total}`);

    let attempt = 0;
    while (true) {
      try {
        lastResponse = await uploadChunk({
          url,
          formData: chunkForm,
          uploadId,
          contentRange: `bytes ${start}-${end - 1}/${total}`,
          onBytes: (loaded) => report(uploadedBytes + loaded),
          signal,
        });
        break;
      } catch (err: any) {
        attempt++;
        console.error(`[upload] chunk ${chunkIdx + 1} attempt ${attempt} failed: ${err.message}`);
        if (attempt >= MAX_RETRIES || err.message === 'Upload cancelled') throw err;
        await new Promise((r) => setTimeout(r, 1000 * 2 ** (attempt - 1)));
      }
    }

    uploadedBytes = end;
    report(uploadedBytes);
  }

  return lastResponse;
}

interface ChunkOpts {
  url: string;
  formData: FormData;
  uploadId: string;
  contentRange: string;
  onBytes: (loaded: number) => void;
  signal?: AbortSignal;
}

function uploadChunk(opts: ChunkOpts): Promise<any> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', opts.url);
    xhr.setRequestHeader('X-Unique-Upload-Id', opts.uploadId);
    xhr.setRequestHeader('Content-Range', opts.contentRange);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) opts.onBytes(e.loaded);
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve(JSON.parse(xhr.responseText)); }
        catch { resolve({}); }
      } else {
        let msg = `Upload failed (${xhr.status})`;
        try { msg = JSON.parse(xhr.responseText)?.error?.message || msg; } catch { /* ignore */ }
        reject(new Error(msg));
      }
    };
    xhr.onerror = () => reject(new Error('Network error during chunk upload'));
    xhr.onabort = () => reject(new Error('Upload cancelled'));

    if (opts.signal) {
      if (opts.signal.aborted) { xhr.abort(); return; }
      opts.signal.addEventListener('abort', () => xhr.abort());
    }
    xhr.send(opts.formData);
  });
}

export function uploadToCloudinary(opts: UploadOptions): Promise<any> {
  const url = `https://api.cloudinary.com/v1_1/${opts.cloudName}/${opts.resourceType}/upload`;
  const file = extractFile(opts.formData);
  if (file && file.size > CHUNK_THRESHOLD) {
    return uploadChunked(opts, url, file);
  }
  return uploadSingle(opts, url);
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
