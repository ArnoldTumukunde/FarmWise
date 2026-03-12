import { getDb } from './db';
import { fetchApi } from '../lib/api';

const api = {
  post: (url: string, body?: any) => fetchApi(url, { method: 'POST', body: JSON.stringify(body) })
};

export async function syncOfflineProgress(): Promise<void> {
  const db = await getDb();
  const pending = await db.getAll('pendingProgress');
  if (pending.length === 0) return;

  const sorted = pending.sort((a, b) => (a.completedAt ?? 0) - (b.completedAt ?? 0));

  try {
    await api.post('/learn/progress/sync', { records: sorted });
    await db.clear('pendingProgress'); // Only clear AFTER server confirms
  } catch (error) {
    // NEVER clear IndexedDB on failure — data must not be lost
    let attempts = 0;
    const retry = async () => {
      attempts++;
      if (attempts > 5) return;
      const delay = Math.min(2000 * Math.pow(2, attempts - 1), 30000);
      await new Promise(resolve => setTimeout(resolve, delay));
      try {
        const db2 = await getDb();
        const stillPending = await db2.getAll('pendingProgress');
        if (stillPending.length === 0) return;
        
        await api.post('/learn/progress/sync', { 
            records: stillPending.sort((a, b) => (a.completedAt ?? 0) - (b.completedAt ?? 0)) 
        });
        await db2.clear('pendingProgress');
      } catch {
        await retry();
      }
    };
    await retry();
  }
}
