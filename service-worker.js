const CACHE_NAME = 'semejka-v2'; // увеличиваем версию при каждом изменении
const ASSETS = [
  '.',
  'index.html',
  'https://s10.iimage.su/s/01/th_gbQUgmlxJOC82rwE42zTtHdJvyk5H1YnnJ3AfyWuK.png'
];

// Установка: кешируем ресурсы
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

// Активация: удаляем старые кеши
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});

// Стратегия «сеть сначала, потом кеш»
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

// Push-уведомления
self.addEventListener('push', event => {
  if (!event.data) return;
  const payload = event.data.json();
  const options = {
    body: payload.body,
    icon: 'https://s10.iimage.su/s/01/th_gbQUgmlxJOC82rwE42zTtHdJvyk5H1YnnJ3AfyWuK.png',
    badge: 'https://s10.iimage.su/s/01/th_gbQUgmlxJOC82rwE42zTtHdJvyk5H1YnnJ3AfyWuK.png',
    vibrate: [200, 100, 200],
    tag: 'semejka-msg',
    data: { url: '.' }
  };
  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow('.'));
});
