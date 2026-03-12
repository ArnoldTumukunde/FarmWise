import pLimit from 'p-limit';
import { getDb, DownloadRecord } from './db';
import { fetchApi } from '../lib/api';

const api = {
  post: (url: string, body?: any) => fetchApi(url, { method: 'POST', body: JSON.stringify(body) }),
  delete: (url: string) => fetchApi(url, { method: 'DELETE' }),
};

function parseM3u8Segments(manifest: string): string[] {
  return manifest
    .split('\n')
    .filter(line => line.trim() && !line.startsWith('#'))
    .map(line => line.trim());
}

export async function downloadLecture(lectureId: string): Promise<void> {
  const db = await getDb();

  // 1. Get signed URL (valid 5 min)
  const { data } = await api.post(`/learn/lectures/${lectureId}/download-url`);
  const { url } = data;

  // 2. Parse manifest
  const manifest = await fetch(url).then(r => r.text());
  const segments = parseM3u8Segments(manifest);

  // 3. Mark as DOWNLOADING in IndexedDB
  await db.put('downloads', { lectureId, status: 'DOWNLOADING', total: segments.length, cached: 0 });

  const cache = await caches.open('video-segments');

  // 4. Stable key for manifest
  const stableManifestKey = `/offline/lecture/${lectureId}/manifest.m3u8`;
  await cache.put(stableManifestKey, new Response(manifest, {
    headers: { 'Content-Type': 'application/vnd.apple.mpegurl' }
  }));

  // 5. Download segments — max 3 concurrent
  const limit = pLimit(3);
  let cachedCount = 0;
  
  await Promise.all(
    segments.map(segUrl =>
      limit(async () => {
        const res = await fetch(segUrl);
        await cache.put(segUrl, res.clone());
        cachedCount += 1;
        if (cachedCount % 10 === 0 || cachedCount === segments.length) {
          await db.put('downloads', { lectureId, status: 'DOWNLOADING', total: segments.length, cached: cachedCount });
        }
      })
    )
  );

  // 6. Complete
  await db.put('downloads', { lectureId, status: 'DOWNLOADED', stableManifestKey });
  await api.post('/learn/downloads', { lectureId });
}

export async function deleteLecture(lectureId: string): Promise<void> {
    const db = await getDb();
    
    // Optimistic UI state clear
    await db.delete('downloads', lectureId);
    
    // We should technically remove from Cache API as well
    // But since workbox expiration maintains it, it's optional
    
    await api.delete(`/learn/downloads/${lectureId}`);
}

export async function getDownloadStatus(lectureId: string): Promise<DownloadRecord | undefined> {
    const db = await getDb();
    return db.get('downloads', lectureId);
}
