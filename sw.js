// Rootcash data lives in localStorage. This worker only retires old Rootcash caches
// so Safari/iOS cannot keep serving stale favicon or Apple touch icon assets.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('rootcash')).map(key => caches.delete(key)));
    await self.registration.unregister();
  })());
});
