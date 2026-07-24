const CACHE_NAME = 'semejka-v60'; 
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

// Активация и сброс старого кэша
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
    
    // Авто-отмена вызова
    if (text.includes('сброс') || text.includes('завершен') || text.includes('отмена')) {
      event.waitUntil(
        self.registration.getNotifications({ tag: 'semejka-call' }).then(notifications => {
          notifications.forEach(notification => notification.close());
        })
      );
      return; 
    }

    const isCall = text.includes('📞') || text.includes('звон') || text.includes('вызов') || text.includes('входящий');
    let finalTag = payload.tag || `semejka-msg-${Date.now()}`;

    const options = {
      body: payload.body || '',
      icon: 'https://s10.iimage.su/s/09/th_gvMJ97Lx8OAzBYuHL1UHLtuA0yebaDQnB8Uie9Xwd.jpg', 
      badge: 'https://s10.iimage.su/s/09/th_gvMJ97Lx8OAzBYuHL1UHLtuA0yebaDQnB8Uie9Xwd.jpg', 
      vibrate: isCall ? [3000] : [200, 100, 200], 
      tag: isCall ? 'semejka-call' : finalTag,
      renotify: true,               // Гарантирует звук и вибрацию при новых уведомлениях
      requireInteraction: isCall,   // Держит плашку звонка активной
      data: { url: './' }
    };

    event.waitUntil(
      self.registration.showNotification(payload.title || 'Семейка+', options)
    );
  } catch (error) {
    console.error('Ошибка при разборе push-уведомления:', error);
    try {
      const rawText = event.data.text();
      const isCall = rawText.includes('📞') || rawText.includes('звон') || rawText.includes('вызов') || rawText.includes('входящий');
      
      self.registration.showNotification('Семейка+', {
        body: rawText,
        icon: 'https://s10.iimage.su/s/09/th_gvMJ97Lx8OAzBYuHL1UHLtuA0yebaDQnB8Uie9Xwd.jpg',
        badge: 'https://s10.iimage.su/s/09/th_gvMJ97Lx8OAzBYuHL1UHLtuA0yebaDQnB8Uie9Xwd.jpg',
        tag: isCall ? 'semejka-call' : `semejka-msg-${Date.now()}`,
        vibrate: isCall ? [3000] : [200, 100, 200],
        renotify: true,
        requireInteraction: isCall,
        data: { url: './' }
      });
    } catch(e) {}
  }
});

// ===== РАЗВОРАЧИВАНИЕ ПРИЛОЖЕНИЯ ИЗ ФОНА ПРИ КЛИКЕ =====
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
