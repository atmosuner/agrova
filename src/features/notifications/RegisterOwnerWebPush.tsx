/* eslint-disable lingui/no-unlocalized-strings -- dev-only debug labels */
import { useEffect } from 'react'
import { useMyPersonQuery } from '@/features/people/useMyPersonQuery'
import { supabase } from '@/lib/supabase'
import { registerWebPushIfPossible } from '@/features/notifications/register-web-push'
import { notifyDebug } from '@/lib/notify-debug'

/**
 * Subscribes the current browser to Web Push for the owner account.
 * Fanout only targets `push_subscriptions` for OWNER persons; workers do not receive these pushes.
 */
export function RegisterOwnerWebPush() {
  const { data: me, isSuccess } = useMyPersonQuery()

  useEffect(() => {
    if (!isSuccess || me == null || me.role !== 'OWNER') {
      return
    }
    notifyDebug('RegisterOwnerWebPush: scheduling register', { personId: me.id })
    void registerWebPushIfPossible(supabase, me.id).then(
      () => notifyDebug('RegisterOwnerWebPush: registerWebPushIfPossible finished'),
      (e: unknown) => notifyDebug('RegisterOwnerWebPush: registerWebPushIfPossible rejected', e),
    )
  }, [isSuccess, me])

  return null
}
