const CACHE_NAME = 'semejka-v59'; // Подняли версию кэша для гарантированного обновления
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
    if (text.includes('сброс') || text.includes('завершен') || text.includes('отмена')) {
      event.waitUntil(
        self.registration.getNotifications({ tag: 'semejka-call' }).then(notifications => {
          notifications.forEach(notification => notification.close());
        })
      );
      return; 
    }

    // Приоритет отдаем уникальному тегу от сервера. Если его нет, делаем уникальный сами
    let finalTag = payload.tag || `semejka-msg-${Date.now()}`;
    
    // Проверка на входящий вызов
    const isCall = text.includes('📞') || text.includes('звон') || text.includes('вызов') || text.includes('входящий');

    const options = {
      body: payload.body || '',
      icon: 'https://s10.iimage.su/s/09/th_gvMJ97Lx8OAzBYuHL1UHLtuA0yebaDQnB8Uie9Xwd.jpg', 
      badge: 'https://s10.iimage.su/s/09/th_gvMJ97Lx8OAzBYuHL1UHLtuA0yebaDQnB8Uie9Xwd.jpg', 
      vibrate: isCall ? [3000] : [200, 100, 200], 
      tag: isCall ? 'semejka-call' : finalTag, // Уникальный тег не дает сообщениям скапливаться в одной плашке
      renotify: true, // Повторный сигнал и вибрация даже при повторных пушах
      requireInteraction: isCall, // Для звонков держим плашку открытой постоянно
      data: { url: './' }
    };

    event.waitUntil(
      self.registration.showNotification(payload.title || 'Семейка+', options)
    );
  } catch (error) {
    // Фоллбэк-обработка на случай, если сервер прислал обычную строку вместо JSON
    console.error('Ошибка при разборе push-уведомления, применяем фоллбэк:', error);
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
      // Ищем открытую фоновую вкладку/окно PWA и фокусируемся на нем
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Если PWA было полностью закрыто — открываем заново
      if (clients.openWindow) {
        return clients.openWindow('./');
      }
    })
  );
});

