// kabuto Service Worker — Web Push notifications
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "kabuto", body: event.data.text(), url: "/" };
  }

  const { title = "kabuto", body = "", url = "/", icon = "/kabuto-logo-light.png" } = payload;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge: "/kabuto-logo-light.png",
      tag: "kabuto-agent-notification",
      renotify: true,
      data: { url },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing tab if possible
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.focus();
            client.navigate(url);
            return;
          }
        }
        // Otherwise open a new tab
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});
