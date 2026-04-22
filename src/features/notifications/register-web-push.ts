/* eslint-disable lingui/no-unlocalized-strings */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/db'

function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = globalThis.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

/**
 * Subscribes this browser to Web Push and stores keys in `push_subscriptions`.
 * The `web-push-fanout` edge function only sends to **owner** `person_id` rows, so
 * the owner app must call this (see `RegisterOwnerWebPush`); worker-only runs do not
 * receive those pushes.
 *
 * No-op if Notification API unavailable, permission denied, or VAPID not configured.
 */
export async function registerWebPushIfPossible(
  supabase: SupabaseClient<Database>,
  personId: string,
): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return
  }
  if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
    return
  }
  let perm: NotificationPermission = 'denied'
  if (typeof Notification !== 'undefined') {
    if (Notification.permission === 'granted') {
      perm = 'granted'
    } else if (Notification.permission === 'default') {
      perm = await Notification.requestPermission()
    }
  }
  if (perm !== 'granted') {
    return
  }
  const { data: vapid, error: vErr } = await supabase.functions.invoke<{ publicKey?: string; ok?: boolean }>(
    'get-vapid-public-key',
    { method: 'GET' },
  )
  if (vErr || !vapid?.publicKey) {
    return
  }
  const reg = await navigator.serviceWorker.ready
  const existing = await reg.pushManager.getSubscription()
  const sub =
    existing ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapid.publicKey),
    }))
  const json = sub.toJSON()
  const endpoint = json.endpoint
  const p256dh = json.keys?.p256dh
  const auth = json.keys?.auth
  if (!endpoint || !p256dh || !auth) {
    return
  }
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      person_id: personId,
      endpoint,
      p256dh,
      auth,
    },
    { onConflict: 'person_id,endpoint' },
  )
  if (error) {
    console.warn('[push_subscriptions]', error.message)
  }
}
