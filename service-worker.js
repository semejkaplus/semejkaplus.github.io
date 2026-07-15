const CACHE_NAME = 'semejka-v40'; // Подняли версию для принудительного обновления у пользователей
const ASSETS = [
  '.',
  'index.html',
  'manifest.json',
  'дляувдм.png', // Кэшируем новую трафаретную иконку
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
    
    // Базовые настройки
    const options = {
      body: payload.body,
      icon: 'https://s10.iimage.su/s/09/th_gvMJ97Lx8OAzBYuHL1UHLtuA0yebaDQnB8Uie9Xwd.jpg', // Цветной логотип
      badge: 'дляувдм.png', // Ваш новый белый трафарет 96x96 для строки состояния Android
      vibrate: [200, 100, 200], // Стандартная короткая вибрация для сообщений
      tag: 'semejka-msg',
      data: { url: './' }
    };

    // Если это входящий звонок — настраиваем долгую вибрацию и отдельный тег
    if (payload.body.includes('📞') || payload.body.includes('вызывает')) {
      options.vibrate = [1500, 300, 1500, 300, 1500]; // Мощная пульсация
      options.tag = 'semejka-call'; // Отдельный тег, чтобы звонок не перекрывался сообщениями
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
  event.notification.close(); // Закрываем шторку уведомления

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
