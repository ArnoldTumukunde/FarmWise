/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core';
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { syncOfflineProgress } from './offline/syncManager';

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: any };

clientsClaim();

// Precache generated assets (HTML, CSS, JS, etc.)
precacheAndRoute(self.__WB_MANIFEST || []);

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Cache API requests for courses
registerRoute(
  /\/api\/v1\/courses/,
  new StaleWhileRevalidate({
    cacheName: 'api-courses',
    plugins: [new ExpirationPlugin({ maxAgeSeconds: 3600 })]
  })
);

// Cache offline HLS video segments from Cloudinary
registerRoute(
  /res\.cloudinary\.com\/.*\.(m3u8|ts)$/,
  new CacheFirst({
    cacheName: 'video-segments',
    plugins: [new ExpirationPlugin({ maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 })]
  })
);

// Cache the stable manifest keys used for offline playback
registerRoute(
  /\/offline\/lecture\/.*\/manifest\.m3u8$/,
  new CacheFirst({
    cacheName: 'video-segments',
    plugins: [new ExpirationPlugin({ maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 })]
  })
);

// Register the background sync event listener
self.addEventListener('sync', (event: any) => {
  if (event.tag === 'sync-progress') {
    event.waitUntil(syncOfflineProgress());
  }
});
