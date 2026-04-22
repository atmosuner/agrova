/* M6: Web Push — show + click; imported by Workbox main SW. */
self.addEventListener('push', (event) => {
  let title = 'Agrova'
  let body = ''
  let data = { url: '/today' }
  try {
    if (event.data) {
      const j = event.data.json()
      title = typeof j.title === 'string' ? j.title : title
      body = typeof j.body === 'string' ? j.body : ''
      if (j.data && typeof j.data === 'object' && j.data.url) {
        data = { url: j.data.url, activityLogId: j.data.activityLogId, action: j.data.action }
      }
    }
  } catch {
    // keep defaults
  }
  const icon = new URL('/icons/pwa-192.png', self.location.origin).href
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      data,
      icon,
      badge: icon,
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  const n = event.notification
  n.close()
  let url = '/today'
  try {
    const d = n.data
    if (d && typeof d === 'object' && 'url' in d && typeof d.url === 'string') {
      url = d.url
    }
  } catch {
    // keep default
  }
  const abs = new URL(url, self.location.origin).href
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      for (const c of all) {
        if (c.url.startsWith(self.location.origin) && 'focus' in c) {
          await c.focus()
          if (typeof c.navigate === 'function') {
            return c.navigate(abs)
          }
          return
        }
      }
      if (self.clients && self.clients.openWindow) {
        await self.clients.openWindow(abs)
      }
    })(),
  )
})
