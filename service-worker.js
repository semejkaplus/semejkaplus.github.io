const CACHE_NAME = 'semejka-v47'; // Подняли версию
const ASSETS = [
  '.',
  'index.html',
  'manifest.json',
  'https://s10.iimage.su/s/09/th_gvMJ97Lx8OAzBYuHL1UHLtuA0yebaDQnB8Uie9Xwd.jpg'
];

// Установка сервис-воркера
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Активация
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Перехват сетевых запросов
self.addEventListener('fetch', event => {
  if (
    event.request.url.includes('supabase.co') || 
    event.request.url.includes('cdn.jsdelivr.net') || 
    event.request.url.includes('firebase') || 
    event.request.url.includes('googleapis.com') || 
    event.request.url.includes('metered.live')
  ) return;

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

// ===== ОБРАБОТКА ВХОДЯЩИХ PUSH-УВЕДОМЛЕНИЙ =====
self.addEventListener('push', event => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const text = (payload.body || '').toLowerCase(); 
    
    // === ЛОГИКА АВТО-ОТМЕНЫ ЗВОНКА ===
    // Если пришел сигнал о том, что звонок сброшен
    if (text.includes('сброс') || text.includes('завершен') || text.includes('отмена')) {
      event.waitUntil(
        self.registration.getNotifications({ tag: 'semejka-call' }).then(notifications => {
          // Находим висящее уведомление звонка и закрываем его
          notifications.forEach(notification => notification.close());
        })
      );
      return; // Выходим из функции, новое уведомление "Звонок сброшен" показывать не нужно
    }

    const options = {
      body: payload.body,
      icon: 'https://s10.iimage.su/s/09/th_gvMJ97Lx8OAzBYuHL1UHLtuA0yebaDQnB8Uie9Xwd.jpg',
      badge: 'semejkapluspush.jpg', 
      vibrate: [200, 100, 200], 
      tag: 'semejka-msg',
      data: { url: './' }
    };

    // Если это входящий звонок
    if (
      text.includes('📞') || 
      text.includes('звон') || 
      text.includes('вызов') || 
      text.includes('входящий')
    ) {
      options.vibrate = [3000]; 
      options.tag = 'semejka-call'; // Важно! Одинаковый тег позволяет нам управлять этим пушем
    }

    event.waitUntil(
      self.registration.showNotification(payload.title, options)
    );
  } catch (error) {
    console.error('Ошибка при разборе push-уведомления:', error);
  }
});

// Действие при клике
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('./');
      }
    })
  );
});
