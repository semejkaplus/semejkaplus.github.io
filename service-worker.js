// ========== КЭШИРОВАНИЕ И ВЕРСИОНИРОВАНИЕ ==========
const CACHE_VERSION = 'v5';  // Увеличиваем версию, чтобы обновленный SW вступил в силу
const CACHE_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/semeykalogo.png',
  '/semeykapush.png'
];

// ========== УСТАНОВКА ==========
self.addEventListener('install', (event) => {
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
      self.clients.claim(),
      caches.keys().then((keys) => {
        return Promise.all(
          keys.filter((key) => key !== CACHE_VERSION)
              .map((key) => caches.delete(key))
        );
      })
    ])
  );
});

// ========== ПЕРЕХВАТ ЗАПРОСОВ ==========
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
    icon: '/semeykalogo.png',
    badge: '/semeykapush.png',
    tag: data.tag || 'semejka-notification',
    renotify: true,
    vibrate: [200, 100, 200],
    
    // Параметры для показа баннера поверх экрана
    requireInteraction: true, // Уведомление не исчезает автоматически
    
    // Строка действий (Actions)
    actions: [
      {
        action: 'open_chat',
        title: 'Открыть'
      },
      {
        action: 'dismiss',
        title: 'Закрыть'
      }
    ],

    data: data
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Семейка', options)
  );
});

// ========== КЛИК ПО УВЕДОМЛЕНИЮ И КНОПКАМ ==========
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Если нажали "Закрыть", ничего не открываем
  if (event.action === 'dismiss') {
    return;
  }

  // Если кликнули на "Открыть" или по самому уведомлению
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (let client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
