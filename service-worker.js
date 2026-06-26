const CACHE_NAME = 'semejka-v17'; // Версия обновлена для пуш-уведомлений
const ASSETS = [
  '.',
  'index.html',
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
    event.request.url.includes('onesignal.com') ||
    event.request.url.includes('workers.dev')
  ) return;

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

// Интеграция дифференцированной обработки пушей звонков и сообщений
self.addEventListener('push', event => {
  if (!event.data) return;
  
  try {
    const payload = event.data.json();
    const customData = payload.custom && payload.custom.a ? payload.custom.a : {};
    
    let options = {
      body: payload.body,
      icon: 'https://s10.iimage.su/s/09/th_gvMJ97Lx8OAzBYuHL1UHLtuA0yebaDQnB8Uie9Xwd.jpg',
      badge: 'https://s10.iimage.su/s/09/th_gvMJ97Lx8OAzBYuHL1UHLtuA0yebaDQnB8Uie9Xwd.jpg',
      data: { url: '.', message: payload }
    };

    // Настраиваем разное поведение вибровызова телефона
    if (customData.type === "call") {
      options.vibrate = [500, 300, 500, 300, 500, 300, 500]; // Длинный вибровызов для звонка
      options.tag = 'semejka-call';
      options.renotify = true;
    } else {
      options.vibrate = [200, 100, 200]; // Короткое вибро для сообщений
      options.tag = 'semejka-msg';
    }

    event.waitUntil(
      self.registration.showNotification(payload.title, options)
    );
  } catch (err) {
    console.error("Ошибка обработки входящего пуша:", err);
  }
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let c of clientList) {
          if (c.focused) { client = c; break; }
        }
        return client.focus();
      }
      return self.clients.openWindow('.');
    })
  );
});
