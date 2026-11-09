// Service Worker – nur für Push-Benachrichtigungen.

self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || "foodie.", {
      body: data.body,
      icon: data.icon,
      data: { url: data.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => "focus" in w);
      if (open) {
        return open.focus().then((w) => ("navigate" in w ? w.navigate(url) : w));
      }
      return self.clients.openWindow(url);
    }),
  );
});
