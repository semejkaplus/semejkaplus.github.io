const CACHE_NAME = 'semejka-v41'; // Снова подняли версию, чтобы сбросить старый кэш
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
    const messageBody = (payload.body || '').toLowerCase(); // Переводим текст в нижний регистр для надежного поиска
    
    // Базовые настройки для обычного сообщения
    const options = {
      body: payload.body,
      icon: 'https://s10.iimage.su/s/09/th_gvMJ97Lx8OAzBYuHL1UHLtuA0yebaDQnB8Uie9Xwd.jpg', // Цветной логотип
      badge: 'дляувдм.png', // Пробуем использовать локальный файл буквы
      vibrate: [200, 100, 200], // Короткая двойная вибрация для СМС
      tag: 'semejka-msg',
      data: { url: './' }
    };

    // Если в тексте пуша есть слова "звон", "вызов", "вызывает" или значок трубки
    if (
      messageBody.includes('📞') || 
      messageBody.includes('звон') || 
      messageBody.includes('вызов') || 
      messageBody.includes('вызывает')
    ) {
      // ПУЛЬСИРУЮЩАЯ ВИБРАЦИЯ: вибрирует 500мс, пауза 250мс, вибрирует 500мс... и так по кругу
      options.vibrate = [500, 250, 500, 250, 500, 250, 500, 250, 500]; 
      options.tag = 'semejka-call'; // Отдельный тег для звонков
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
