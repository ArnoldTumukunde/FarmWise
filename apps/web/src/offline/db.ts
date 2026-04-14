import { openDB, type IDBPDatabase } from 'idb';

export interface DownloadRecord {
  lectureId: string;         // key
  status: 'DOWNLOADING' | 'DOWNLOADED' | 'FAILED';
  total: number;             // total segments
  cached: number;            // segments cached so far
  stableManifestKey?: string; // set on DOWNLOADED
  sizeBytes?: number;
}

export interface ProgressRecord {
  lectureId: string;         // key
  enrollmentId: string;
  isCompleted: boolean;
  watchedSeconds: number;
  completedAt?: number;      // epoch ms — used for sort before sync
}

let _db: IDBPDatabase | null = null;

export async function getDb() {
  if (_db) return _db;
  _db = await openDB('aan-academy', 2, {
    upgrade(db) {
      // Object store for download state; key = lectureId
      if (!db.objectStoreNames.contains('downloads')) {
        db.createObjectStore('downloads', { keyPath: 'lectureId' });
      }
      // Object store for unsynchronised progress; key = lectureId
      if (!db.objectStoreNames.contains('pendingProgress')) {
        db.createObjectStore('pendingProgress', { keyPath: 'lectureId' });
      }
      // Object store for auth tokens (used by service worker for background sync)
      if (!db.objectStoreNames.contains('auth')) {
        db.createObjectStore('auth');
      }
    },
  });
  return _db;
}
