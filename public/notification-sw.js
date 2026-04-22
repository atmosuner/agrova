/* M6-04: Web Push — handle notification click (imported by Workbox main SW) */
self.addEventListener('notificationclick', (event) => {
  const n = event.notification
  n.close()
  let url = '/today'
  try {
    const raw = n.data
    const o = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (o && typeof o.data?.url === 'string') {
      url = o.data.url
    }
  } catch {
    // keep default
  }
  if (self.clients && self.clients.openWindow) {
    event.waitUntil(self.clients.openWindow(url))
  }
})
