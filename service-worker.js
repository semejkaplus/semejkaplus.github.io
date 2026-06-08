self.addEventListener('push', event => {
  if (!event.data) return;
  const payload = event.data.json();
  const options = {
    body: payload.body,
    icon: 'https://s10.iimage.su/s/01/th_gbQUgmlxJOC82rwE42zTtHdJvyk5H1YnnJ3AfyWuK.png',
    badge: 'https://s10.iimage.su/s/01/th_gbQUgmlxJOC82rwE42zTtHdJvyk5H1YnnJ3AfyWuK.png',
    vibrate: [200, 100, 200],
    tag: 'semejka-msg',
    data: { url: '.' }
  };
  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow('.'));
});
