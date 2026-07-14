const CACHE_NAME = 'semejka-v38'; // Подняли версию для сброса старого кэша
const ASSETS = [
  '.',
  'index.html',
  'manifest.json',
  'https://s10.iimage.su/s/09/th_gvMJ97Lx8OAzBYuHL1UHLtuA0yebaDQnB8Uie9Xwd.jpg'
];

// Установка сервис-воркера и кэширование ресурсов PWA
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting(); // Автоматическая активация новой версии
});

// Активация и удаление старого кэша
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
  // Добавляем исключения для сторонних сервисов и Firebase, чтобы WebRTC-сигналинг и база данных не зависали
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
    // Получаем данные, которые прислала наша Cloud Function
    const payload = event.data.json();
    
    const options = {
      body: payload.body,
      icon: 'https://s10.iimage.su/s/09/th_gvMJ97Lx8OAzBYuHL1UHLtuA0yebaDQnB8Uie9Xwd.jpg',
      badge: 'https://s10.iimage.su/s/09/th_gvMJ97Lx8OAzBYuHL1UHLtuA0yebaDQnB8Uie9Xwd.jpg',
      vibrate: [200, 100, 200],
      tag: 'semejka-msg', // Этот тег группирует уведомления, чтобы они не спамили экран
      data: { url: './' } // Ссылка, которая откроется при клике на уведомление
    };

    event.waitUntil(
      self.registration.showNotification(payload.title, options)
    );
  } catch (error) {
    console.error('Ошибка при разборе push-уведомления:', error);
  }
});

// Действие при клике на уведомление (открывает чат)
self.addEventListener('notificationclick', event => {
  event.notification.close(); // Закрываем шторку уведомления

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // Если чат уже открыт во вкладке, переключаемся на неё
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Если чат не открыт, открываем новую вкладку
      if (clients.openWindow) {
        return clients.openWindow('./');
      }
    })
  );
});
