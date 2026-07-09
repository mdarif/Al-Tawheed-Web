/*
 * Kitab al-Tawheed — offline service worker.
 *
 * Hand-rolled (no Workbox) so the build stays untouched. Runtime caching for
 * the hub pages + hashed build assets; lecture/dars audio is CDN-hosted and
 * deliberately NOT cached here (large files — that's the Flutter app's job).
 *
 * Bump CACHE_VERSION to invalidate old caches on the next visit.
 */
const CACHE_VERSION = 'v2';
const SHELL_CACHE = `tawheed-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `tawheed-runtime-${CACHE_VERSION}`;

// Hub pages precached on install — not the 141 individual lecture/dars pages.
// `/offline/` is the fallback for a never-visited page requested while offline.
const SHELL = [
  '/',
  '/ur/',
  '/lectures/',
  '/arabic/',
  '/about/',
  '/download/',
  '/search/',
  '/offline/',
  '/site.webmanifest',
  '/favicon.ico',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      // Best-effort: one 404 shouldn't abort the whole install.
      .then((cache) => Promise.allSettled(SHELL.map((url) => cache.add(url))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== SHELL_CACHE && k !== RUNTIME_CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

/** Cache-first: return the cached copy, else fetch once and store it. */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

/** Stale-while-revalidate: serve cache immediately, refresh in the background. */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  });
  return cached ?? fetchPromise.catch(() => cached);
}

/** Network-first for navigations, falling back to cache then the offline page. */
async function navigationHandler(request) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    return cached ?? (await cache.match('/offline/'));
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Never intercept cross-origin requests — lecture audio and the content
  // catalog are served from al-tawheed-content.pages.dev.
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(navigationHandler(request));
    return;
  }

  if (url.pathname.startsWith('/_astro/') || url.pathname.startsWith('/pagefind/')) {
    event.respondWith(cacheFirst(request, RUNTIME_CACHE));
    return;
  }

  if (
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/og/') ||
    url.pathname === '/site.webmanifest' ||
    url.pathname === '/favicon.ico' ||
    url.pathname.startsWith('/favicon-') ||
    url.pathname === '/apple-touch-icon.png'
  ) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
    return;
  }

  // Everything else (audio, catalog JSON, sitemap, etc.) — network only.
});
