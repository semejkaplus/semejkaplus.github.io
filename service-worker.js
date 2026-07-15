const CACHE_NAME = 'semejka-v53'; // Подняли версию до v53
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
  self.skipWaiting();
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
    const textLow = (payload.body || '').toLowerCase(); 
    
    // Логика отмены звонка
    if (textLow.includes('сброс') || textLow.includes('завершен') || textLow.includes('отмена')) {
      event.waitUntil(
        self.registration.getNotifications({ tag: 'semejka-call' }).then(notifications => {
          notifications.forEach(notification => notification.close());
        })
      );
      return; 
    }

    // Базовые настройки уведомления
    const options = {
      body: payload.body, // Текст сообщения (в нем уже лежит имя жирным Юникодом от сервера)
      icon: 'https://s10.iimage.su/s/09/th_gvMJ97Lx8OAzBYuHL1UHLtuA0yebaDQnB8Uie9Xwd.jpg', 
      badge: 'semejkapluspush.png', 
      vibrate: [200, 100, 200], 
      tag: 'semejka-msg',
      renotify: true,
      silent: false,
      data: { url: './' }
    };

    // Если это входящий вызов
    if (
      textLow.includes('звон') || 
      textLow.includes('вызов') || 
      textLow.includes('входящий')
    ) {
      options.vibrate = [3000]; 
      options.tag = 'semejka-call'; 
      options.requireInteraction = true;
    }

    event.waitUntil(
      self.registration.showNotification(payload.title || 'Семейка+', options)
    );
  } catch (error) {
    console.error('Ошибка push в SW:', error);
  }
});

// ===== ЗАКРЫТИЕ ПРИ КЛИКЕ =====
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
