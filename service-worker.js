const CACHE_NAME = 'semejka-v10';
const ASSETS = [
  '.',
  'index.html',
  'https://s10.iimage.su/s/01/th_gbQUgmlxJOC82rwE42zTtHdJvyk5H1YnnJ3AfyWuK.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});

self.addEventListener('fetch', event => {
  if (event.request.url.includes('supabase.co') || event.request.url.includes('cdn.jsdelivr.net')) return;
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

self.addEventListener('push', event => {
  if (!event.data) return;
  const payload = event.data.json();
  const options = {
    body: payload.body,
    icon: 'https://s10.iimage.su/s/01/th_gbQUgmlxJOC82rwE42zTtHdJvyk5H1YnnJ3AfyWuK.png',
    badge: 'https://s10.iimage.su/s/01/th_gbQUgmlxJOC82rwE42zTtHdJvyk5H1YnnJ3AfyWuK.png',
    vibrate: [200, 100, 200],
    tag: 'semejka-msg',
    data: { url: '.', message: payload }
  };
  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage(event.notification.data.message);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow('.');
    })
  );
});
