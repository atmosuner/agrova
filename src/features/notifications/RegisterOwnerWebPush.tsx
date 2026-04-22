import { useEffect } from 'react'
import { useMyPersonQuery } from '@/features/people/useMyPersonQuery'
import { supabase } from '@/lib/supabase'
import { registerWebPushIfPossible } from '@/features/notifications/register-web-push'

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
    void registerWebPushIfPossible(supabase, me.id)
  }, [isSuccess, me])

  return null
}
