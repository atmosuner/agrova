/* eslint-disable lingui/no-unlocalized-strings */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/db'
import { notifyDebug } from '@/lib/notify-debug'

/** Invokes edge `web-push-fanout` with the current session (must be actor or owner for the row). */
export async function invokeWebPushFanout(supabase: SupabaseClient<Database>, activityLogId: string): Promise<void> {
  notifyDebug('invokeWebPushFanout: call', { activityLogId })
  const { data, error } = await supabase.functions.invoke<{
    ok?: boolean
    sent?: number
    error?: string
    function?: string
  }>('web-push-fanout', {
    body: { activityLogId },
  })
  if (error) {
    notifyDebug('invokeWebPushFanout: error', { activityLogId, message: error.message, name: error.name })
    console.warn('[web-push-fanout]', error.message)
  } else {
    notifyDebug('invokeWebPushFanout: response', { activityLogId, data })
  }
}
