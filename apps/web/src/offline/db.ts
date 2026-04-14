import { openDB, type IDBPDatabase } from 'idb';

export interface DownloadRecord {
  lectureId: string;         // key
  status: 'DOWNLOADING' | 'DOWNLOADED' | 'FAILED';
  total: number;             // total segments
  cached: number;            // segments cached so far
  stableManifestKey?: string; // set on DOWNLOADED
  sizeBytes?: number;
  encrypted?: boolean;       // true if segments are AES-encrypted in IDB
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
  _db = await openDB('aan-academy', 3, {
    upgrade(db, oldVersion) {
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
      // v3: Encrypted video segments stored in IDB (not Cache API)
      if (oldVersion < 3) {
        if (!db.objectStoreNames.contains('encryptedSegments')) {
          db.createObjectStore('encryptedSegments');
        }
        if (!db.objectStoreNames.contains('encryptionKeys')) {
          db.createObjectStore('encryptionKeys');
        }
      }
    },
  });
  return _db;
}
