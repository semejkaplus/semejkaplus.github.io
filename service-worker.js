const CACHE_NAME = 'semejka-v52'; // Подняли версию до v50 для принудительного обновления!
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
    
    // Исходные значения из пришедшего пуша
    let displayTitle = payload.title || 'Семейка+';
    let displayBody = payload.body || '';

    const textLow = displayBody.toLowerCase(); 
    
    // === ЛОГИКА АВТО-ОТМЕНЫ ЗВОНКА ===
    if (textLow.includes('сброс') || textLow.includes('завершен') || textLow.includes('отмена')) {
      event.waitUntil(
        self.registration.getNotifications({ tag: 'semejka-call' }).then(notifications => {
          notifications.forEach(notification => notification.close());
        })
      );
      return; 
    }

    // === УМНОЕ РАЗДЕЛЕНИЕ НА ИМЯ И СООБЩЕНИЕ НА СТОРОНЕ КЛИЕНТА ===
    // Если заголовок пришел дефолтный ("Семейка+"), но в тексте сообщения есть двоеточие ":"
    if ((displayTitle === 'Семейка+' || !displayTitle) && displayBody.includes(':')) {
      const parts = displayBody.split(':');
      displayTitle = parts[0].trim(); // Имя становится жирным ЗАГОЛОВКОМ
      displayBody = parts.slice(1).join(':').trim(); // Само сообщение уходит в текст снизу
    }

    // Базовые настройки уведомления
    const options = {
      body: displayBody,
      icon: 'https://s10.iimage.su/s/09/th_gvMJ97Lx8OAzBYuHL1UHLtuA0yebaDQnB8Uie9Xwd.jpg', 
      badge: 'semejkapluspush.png', 
      vibrate: [200, 100, 200], 
      tag: 'semejka-msg',
      renotify: true,             // Будить экран при каждом новом пуше
      silent: false,              // Со звуком
      data: { url: './' }
    };

    // Если это входящий ВЫЗОВ
    if (
      textLow.includes('звон') || 
      textLow.includes('вызов') || 
      textLow.includes('входящий')
    ) {
      options.vibrate = [3000]; 
      options.tag = 'semejka-call'; 
      options.requireInteraction = true; // Чтобы плашка звонка не исчезала сама
      displayTitle = "Входящий вызов";
    }

    event.waitUntil(
      self.registration.showNotification(displayTitle, options)
    );
  } catch (error) {
    console.error('Ошибка при обработке push-уведомления в SW:', error);
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
