import { create } from 'zustand';
import { syncOfflineProgress } from './syncManager';

interface OfflineState {
  isOffline: boolean;
}

export const useOfflineStore = create<OfflineState>(() => ({
  isOffline: typeof navigator !== 'undefined' ? !navigator.onLine : false,
}));

if (typeof window !== 'undefined') {
  window.addEventListener('online',  () => useOfflineStore.setState({ isOffline: false }));
  window.addEventListener('offline', () => useOfflineStore.setState({ isOffline: true }));

  // On reconnect: register background sync (service worker handles the actual call)
  window.addEventListener('online', async () => {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      const sw = await navigator.serviceWorker.ready as any;
      try {
        await sw.sync.register('sync-progress'); // Triggers the 'sync' event in service worker
      } catch (err) {
        console.error('Background sync registration failed:', err);
        // Fallback if permission denied
        await syncOfflineProgress();
      }
    } else {
      // Fallback for browsers without Background Sync API
      await syncOfflineProgress();
    }
  });
}
