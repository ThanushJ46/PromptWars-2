// sw.js — Matadan Service Worker
// Handles offline caching and AI fallback

const CACHE_VERSION = 'matadan-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/main.css',
  '/css/components.css',
  '/css/animations.css',
  '/css/responsive.css',
  '/js/app.js',
  '/js/chatbot.js',
  '/js/data.js',
  '/js/env.js',
  '/js/animations.js',
  '/js/maps.js',
  '/js/reminder.js',
  '/js/pwa.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// INSTALL — cache all static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ACTIVATE — clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key.startsWith('matadan-') && key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// FETCH — serve from cache, fall back to network, fall back to offline page
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle Gemini API calls — return offline AI response if network fails
  if (url.hostname === 'generativelanguage.googleapis.com') {
    event.respondWith(
      fetch(request)
        .then(response => response)
        .catch(() => {
          return new Response(
            JSON.stringify({
              candidates: [{
                content: {
                  parts: [{
                    text: "I'm currently in **offline mode**. Here's what I know:\n\n📋 **To register as a new voter:** Visit voters.eci.gov.in and fill Form 6.\n\n🪪 **Documents needed to vote:** Voter ID (EPIC), or any of 12 alternates including Aadhaar, Passport, PAN Card, Driving License.\n\n📍 **Find your booth:** Visit electoralsearch.eci.gov.in\n\n📞 **Voter Helpline:** Call 1950 (free, multilingual)\n\n🚨 **Report violations:** Use cVIGIL app or call 1950\n\nFor more specific questions, please reconnect to the internet."
                  }]
                }
              }]
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        })
    );
    return;
  }

  // Handle Google Maps API — return graceful fallback if offline
  if (url.hostname === 'maps.googleapis.com' || url.hostname === 'maps.gstatic.com') {
    event.respondWith(
      fetch(request).catch(() => new Response('', { status: 503 }))
    );
    return;
  }

  // For all other requests — Cache First, then Network
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) return cachedResponse;

        return fetch(request)
          .then(networkResponse => {
            if (request.method === 'GET' && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(DYNAMIC_CACHE).then(cache => {
                cache.put(request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            if (request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            return new Response('Offline', { status: 503 });
          });
      })
  );
});

// Handle background sync
self.addEventListener('sync', event => {
  if (event.tag === 'sync-queries') {
    event.waitUntil(syncQueuedQueries());
  }
});

async function syncQueuedQueries() {
  console.log('Matadan: Background sync triggered');
}
