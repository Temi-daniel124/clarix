/*
 * Clarix service worker — app-shell caching only.
 *
 * Deliberately minimal, and deliberately conservative about what it will ever serve from
 * cache. Clarix shows salary figures and loan balances; a stale cached number on a financial
 * screen is worse than no number at all. So:
 *
 *   - Only the shell (the offline fallback page and the icons) is precached.
 *   - Every navigation goes to the network first, falling back to the offline page.
 *   - Nothing under the Supabase API, and no page response carrying member data, is cached.
 *
 * See docs/ARCHITECTURE.md § PWA behavior.
 */

const CACHE = "clarix-shell-v1";
const SHELL = ["/offline", "/icons/icon.svg", "/icons/icon-maskable.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/offline").then((cached) => cached || Response.error())),
    );
    return;
  }

  // Static shell assets only: cache-first is safe here because none of them carry data.
  if (url.pathname.startsWith("/icons/")) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
  }
});
