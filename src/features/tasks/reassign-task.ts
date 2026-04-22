/* eslint-disable lingui/no-unlocalized-strings */
import type { SupabaseClient } from '@supabase/supabase-js'
import { logActivity } from '@/features/tasks/log-activity'
import type { Database } from '@/types/db'

export async function reassignTask(
  supabase: SupabaseClient<Database>,
  input: { taskId: string; newAssigneeId: string; actorId: string },
): Promise<void> {
  const { error: rpcErr } = await supabase.rpc('reassign_task', {
    p_task_id: input.taskId,
    p_new_assignee: input.newAssigneeId,
  })
  if (rpcErr) {
    throw rpcErr
  }
  await logActivity(supabase, {
    actorId: input.actorId,
    action: 'task.reassigned',
    subjectType: 'task',
    subjectId: input.taskId,
    payload: { new_assignee_id: input.newAssigneeId },
  })
}
