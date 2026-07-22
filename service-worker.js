// === SERVICE WORKER ДЛЯ PWA СЕМЕЙКА+ ===

// 1. Событие получения Push-уведомления (Фоновый режим и закрытое приложение)
self.addEventListener('push', (event) => {
  let data = { title: 'Семейка+', body: 'Новое сообщение' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const title = data.title || 'Семейка+';
  const options = {
    body: data.body || '',
    icon: '/icon-192.png',      // Убедитесь, что иконка лежит в корне
    badge: '/icon-192.png',     // Иконка для шторки уведомления
    tag: data.tag || 'semejka-general', // Тэг разделения (звонок/сообщение)
    renotify: true,             // Принудительно вибрировать и звучать при новом сообщении
    vibrate: [200, 100, 200],   // Вибрация для привлечения внимания в фоне
    data: {
      url: self.location.origin // Ссылка для открытия приложения по клику
    }
  };

  // Обязательное ожидание отрисовки плашки
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// 2. Обработка клика по уведомлению (Переход в приложение из фона)
self.addEventListener('notificationclick', (event) => {
  event.notification.close(); // Закрываем плашку

  // Будим или разворачиваем уже открытую вкладку/PWA из фона
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Если PWA уже открыто в фоне — фокусируемся на нем
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Если PWA было полностью закрыто — открываем его
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
