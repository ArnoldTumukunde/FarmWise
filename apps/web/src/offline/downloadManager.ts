import pLimit from 'p-limit';
import { getDb, DownloadRecord } from './db';
import { fetchApi } from '../lib/api';
import { generateKey, encryptSegment, decryptSegment } from './crypto';

const api = {
  post: (url: string, body?: any) => fetchApi(url, { method: 'POST', body: JSON.stringify(body) }),
  delete: (url: string) => fetchApi(url, { method: 'DELETE' }),
};

function parseM3u8Segments(manifest: string, baseUrl: string): string[] {
  return manifest
    .split('\n')
    .filter(line => line.trim() && !line.startsWith('#'))
    .map(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('http')) return trimmed;
      // Resolve relative segment URLs against manifest base
      return new URL(trimmed, baseUrl).href;
    });
}

/**
 * Rewrite the M3U8 manifest so segment URLs point to our local blob: scheme.
 * On playback we intercept these via a custom HLS.js loader.
 */
function rewriteManifest(manifest: string, lectureId: string): string {
  let segIndex = 0;
  return manifest
    .split('\n')
    .map(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        return `offline-seg://${lectureId}/${segIndex++}`;
      }
      return line;
    })
    .join('\n');
}

export async function downloadLecture(lectureId: string): Promise<void> {
  const db = await getDb();

  // 1. Get signed URL (valid 5 min)
  const { url } = await api.post(`/learn/lectures/${lectureId}/download-url`);

  // 2. Parse manifest
  const manifestText = await fetch(url).then(r => r.text());
  const segments = parseM3u8Segments(manifestText, url);

  // 3. Generate encryption key for this lecture
  const encKey = await generateKey();
  await db.put('encryptionKeys', encKey, lectureId);

  // 4. Mark as DOWNLOADING
  await db.put('downloads', {
    lectureId,
    status: 'DOWNLOADING',
    total: segments.length,
    cached: 0,
    encrypted: true,
  } as DownloadRecord);

  // 5. Store rewritten manifest (points to offline-seg:// URIs)
  const rewrittenManifest = rewriteManifest(manifestText, lectureId);
  const stableManifestKey = `/offline/lecture/${lectureId}/manifest.m3u8`;
  const cache = await caches.open('offline-manifests');
  await cache.put(stableManifestKey, new Response(rewrittenManifest, {
    headers: { 'Content-Type': 'application/vnd.apple.mpegurl' },
  }));

  // 6. Download, encrypt, and store segments in IndexedDB
  const limit = pLimit(3);
  let cachedCount = 0;

  await Promise.all(
    segments.map((segUrl, idx) =>
      limit(async () => {
        const res = await fetch(segUrl);
        const plaintext = await res.arrayBuffer();
        const encrypted = await encryptSegment(encKey, plaintext);

        // Store encrypted segment in IDB keyed by "lectureId/index"
        await db.put('encryptedSegments', encrypted, `${lectureId}/${idx}`);

        cachedCount += 1;
        if (cachedCount % 10 === 0 || cachedCount === segments.length) {
          await db.put('downloads', {
            lectureId,
            status: 'DOWNLOADING',
            total: segments.length,
            cached: cachedCount,
            encrypted: true,
          } as DownloadRecord);
        }
      })
    )
  );

  // 7. Complete
  await db.put('downloads', {
    lectureId,
    status: 'DOWNLOADED',
    stableManifestKey,
    total: segments.length,
    cached: segments.length,
    encrypted: true,
  } as DownloadRecord);
  await api.post('/learn/downloads', { lectureId });
}

/**
 * Decrypt a stored segment for playback.
 * Called by the custom HLS.js fragment loader.
 */
export async function getDecryptedSegment(lectureId: string, segIndex: number): Promise<ArrayBuffer | null> {
  const db = await getDb();
  const key = await db.get('encryptionKeys', lectureId);
  if (!key) return null;
  const encrypted = await db.get('encryptedSegments', `${lectureId}/${segIndex}`);
  if (!encrypted) return null;
  return decryptSegment(key, encrypted);
}

/**
 * Download all video lectures in a course sequentially.
 */
export async function downloadCourse(
  sections: { lectures: { id: string; type: string; videoPublicId?: string | null }[] }[],
  onProgress?: (completed: number, total: number) => void,
): Promise<void> {
  const videoLectures = sections
    .flatMap(s => s.lectures)
    .filter(l => l.type === 'VIDEO' && l.videoPublicId);

  const total = videoLectures.length;
  let completed = 0;

  for (const lecture of videoLectures) {
    const status = await getDownloadStatus(lecture.id);
    if (status?.status === 'DOWNLOADED') {
      completed++;
      onProgress?.(completed, total);
      continue;
    }
    try {
      await downloadLecture(lecture.id);
    } catch (err) {
      console.error(`Failed to download lecture ${lecture.id}:`, err);
    }
    completed++;
    onProgress?.(completed, total);
  }
}

export async function deleteLecture(lectureId: string): Promise<void> {
  const db = await getDb();

  // Get segment count to clean up IDB entries
  const record = await db.get('downloads', lectureId);
  if (record?.total) {
    for (let i = 0; i < record.total; i++) {
      await db.delete('encryptedSegments', `${lectureId}/${i}`);
    }
  }

  // Clean up keys and download record
  await db.delete('encryptionKeys', lectureId);
  await db.delete('downloads', lectureId);

  // Clean up cached manifest
  const cache = await caches.open('offline-manifests');
  await cache.delete(`/offline/lecture/${lectureId}/manifest.m3u8`);

  try {
    await api.delete(`/learn/downloads/${lectureId}`);
  } catch { /* server cleanup is best-effort */ }
}

export async function deleteCourseDownloads(
  sections: { lectures: { id: string }[] }[],
): Promise<void> {
  const lectureIds = sections.flatMap(s => s.lectures.map(l => l.id));
  for (const lectureId of lectureIds) {
    const status = await getDownloadStatus(lectureId);
    if (status?.status === 'DOWNLOADED') {
      await deleteLecture(lectureId);
    }
  }
}

export async function getDownloadStatus(lectureId: string): Promise<DownloadRecord | undefined> {
  const db = await getDb();
  return db.get('downloads', lectureId);
}
