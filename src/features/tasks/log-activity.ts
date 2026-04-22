/* eslint-disable lingui/no-unlocalized-strings -- DB action slugs */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/types/db'

type Action =
  | 'task.created'
  | 'task.reassigned'
  | 'task.duplicated'
  | 'task.started'
  | 'task.done'
  | 'task.blocked'

/**
 * Inserts a single activity_log row. Prefer DB triggers (M2-08) when they cover the event.
 */
export async function logActivity(
  supabase: SupabaseClient<Database>,
  input: {
    actorId: string
    action: Action
    subjectType: 'task' | 'issue'
    subjectId: string
    payload?: Json
  },
): Promise<void> {
  const { error } = await supabase.from('activity_log').insert({
    actor_id: input.actorId,
    action: input.action,
    subject_type: input.subjectType,
    subject_id: input.subjectId,
    payload: input.payload ?? {},
  })
  if (error) {
    throw error
  }
}
