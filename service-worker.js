const CACHE_NAME = 'semejka-v45'; // Подняли версию, чтобы все телефоны принудительно обновили кэш
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
    // Приводим текст к нижнему регистру для надежного поиска совпадений
    const text = (payload.body || '').toLowerCase(); 
    
    const options = {
      body: payload.body,
      icon: 'https://s10.iimage.su/s/09/th_gvMJ97Lx8OAzBYuHL1UHLtuA0yebaDQnB8Uie9Xwd.jpg', // Наша цветная аватарка в шторке
      badge: 'semejkapluspush.jpg', // Имя вашего файла с буквой (JPG-формат)
      vibrate: [200, 100, 200], // Обычная двойная вибрация для сообщений
      tag: 'semejka-msg',
      data: { url: './' }
    };

    // Проверяем, относится ли пуш к звонку по ключевым словам ("входящий", "вызов", "звон" или значок 📞)
    if (
      text.includes('📞') || 
      text.includes('звон') || 
      text.includes('вызов') || 
      text.includes('входящий')
    ) {
      options.vibrate = [3000]; // Ровно 3 секунды непрерывной вибрации
      options.tag = 'semejka-call'; // Группируем отдельно от сообщений
    }

    event.waitUntil(
      self.registration.showNotification(payload.title, options)
    );
  } catch (error) {
    console.error('Ошибка при разборе push-уведомления:', error);
  }
});

// Действие при клике на уведомление (открывает чат)
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
