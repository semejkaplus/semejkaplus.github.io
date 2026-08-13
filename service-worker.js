// ========== КЭШИРОВАНИЕ И ВЕРСИОНИРОВАНИЕ ==========
const CACHE_VERSION = 'v2';  // Увеличивайте при любых изменениях ресурсов
const CACHE_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/semeykalogo.png',
  '/semeykapush.png'
];

// ========== УСТАНОВКА ==========
self.addEventListener('install', (event) => {
  // Принудительно активируем новый Service Worker
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return cache.addAll(CACHE_FILES);
    })
  );
});

// ========== АКТИВАЦИЯ ==========
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Захватываем все клиенты сразу
      self.clients.claim(),
      // Удаляем старые кэши
      caches.keys().then((keys) => {
        return Promise.all(
          keys.filter((key) => key !== CACHE_VERSION)
              .map((key) => caches.delete(key))
        );
      })
    ])
  );
});

// ========== ПЕРЕХВАТ ЗАПРОСОВ (отвечаем из кэша) ==========
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// ========== PUSH-УВЕДОМЛЕНИЯ ==========
self.addEventListener('push', (event) => {
  let data = { title: 'Семейка', body: 'Новое сообщение!' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body || '',
    // Основная иконка (цветная, большая)
    icon: '/semeykalogo.png',
    // Маленький значок в статус-баре (монохромный, белый на прозрачном)
    badge: '/semeykapush.png',
    tag: data.tag || 'semejka-notification',
    renotify: true,
    vibrate: [200, 100, 200],
    data: data
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Семейка', options)
  );
});

// ========== КЛИК ПО УВЕДОМЛЕНИЮ ==========
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (let client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
