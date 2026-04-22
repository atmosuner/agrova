/* eslint-disable lingui/no-unlocalized-strings */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/db'

/** Invokes edge `web-push-fanout` with the current session (must be actor or owner for the row). */
export async function invokeWebPushFanout(supabase: SupabaseClient<Database>, activityLogId: string): Promise<void> {
  const { error } = await supabase.functions.invoke('web-push-fanout', {
    body: { activityLogId },
  })
  if (error) {
    console.warn('[web-push-fanout]', error.message)
  }
}
