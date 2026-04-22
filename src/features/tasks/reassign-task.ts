/* eslint-disable lingui/no-unlocalized-strings */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/db'

/** DB trigger `tasks_log_update` writes `task.reassigned` to activity_log. */
export async function reassignTask(
  supabase: SupabaseClient<Database>,
  input: { taskId: string; newAssigneeId: string },
): Promise<void> {
  const { error: rpcErr } = await supabase.rpc('reassign_task', {
    p_task_id: input.taskId,
    p_new_assignee: input.newAssigneeId,
  })
  if (rpcErr) {
    throw rpcErr
  }
}
