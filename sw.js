/* Bodyguard SW · 작은앱공방 */
'use strict';

var CACHE_NAME = 'bodyguard-v2';
var URLS = [
  '/bodyguard/',
  '/bodyguard/index.html',
  '/bodyguard/manifest.json',
  '/bodyguard/icons/icon-192x192.png',
  '/bodyguard/icons/icon-512x512.png'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(URLS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request);
    })
  );
});

/* 알림 스케줄 처리 */
self.addEventListener('message', function(e) {
  if (!e.data || e.data.type !== 'SCHEDULE_NOTIFICATION') return;
  var delay = e.data.notifTime - Date.now();
  if (delay < 0) delay = 0;
  setTimeout(function() {
    self.registration.showNotification(e.data.title, {
      body: e.data.body,
      icon: '/bodyguard/icons/icon-192x192.png',
      badge: '/bodyguard/icons/icon-192x192.png',
      vibrate: [200, 100, 200],
      requireInteraction: true
    });
  }, delay);
});

self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  e.waitUntil(clients.openWindow('/bodyguard/'));
});
