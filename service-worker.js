// service-worker.js

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// ОБРАБОТЧИК ВХОДЯЩИХ PUSH-УВЕДОМЛЕНИЙ
self.addEventListener('push', (event) => {
  let data = { title: 'Семейка+', body: 'Новое сообщение!' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body || '',
    // Использование загруженного файла с сервера
    icon: '/semejkapluspush.png',
    badge: '/semejkapluspush.png',
    tag: data.tag || 'semejka-notification',
    renotify: true,
    vibrate: [200, 100, 200],
    data: data
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Семейка+', options)
  );
});

// Клик по уведомлению — открывает или разворачивает PWA
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (let client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
