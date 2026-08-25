// Minimal service worker — enough to make the app installable as a PWA.
// A network-first passthrough; we deliberately avoid caching API/auth responses.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // No-op: let the browser handle requests normally. Present so the app
  // meets the installability criteria.
});
