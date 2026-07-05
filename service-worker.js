const CACHE_NAME = 'semejka-v24'; // Подняли версию для сброса старого кэша
const ASSETS = [
  '.',
  'index.html',
  'manifest.json',
  'https://s10.iimage.su/s/09/th_gvMJ97Lx8OAzBYuHL1UHLtuA0yebaDQnB8Uie9Xwd.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting(); // Автоматическая активация новой версии
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Добавляем исключения для Firebase, чтобы WebRTC-сигналинг и база данных не зависали
  if (
    event.request.url.includes('supabase.co') || 
    event.request.url.includes('cdn.jsdelivr.net') ||
    event.request.url.includes('firebase') ||
    event.request.url.includes('googleapis.com')
  ) return;

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

self.addEventListener('push', event => {
  if (!event.data) return;
  const payload = event.data.json();
  const options = {
    body: payload.body,
    icon: 'https://s10.iimage.su/s/09/th_gvMJ97Lx8OAzBYuHL1UHLtuA0yebaDQnB8Uie9Xwd.jpg',
    badge: 'https://s10.iimage.su/s/09/th_gvMJ97Lx8OAzBYuHL1UHLtuA0yebaDQnB8Uie9Xwd.jpg',
    vibrate: [200, 100, 200],
    tag: 'semejka-msg',
    data: { url: '.', message: payload }
  };
  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      for (let i = 0; i < windowClients.length; i++) {
        let client = windowClients[i];
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});
