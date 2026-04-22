/* eslint-disable lingui/no-unlocalized-strings -- internal error strings for developers */
import type { SupabaseClient } from '@supabase/supabase-js'
import { logActivity } from '@/features/tasks/log-activity'
import type { Database, Enums } from '@/types/db'

export type CreateTasksInput = {
  fieldIds: string[]
  activityText: string
  assigneeId: string
  dueDate: string
  priority: Enums<'task_priority'>
  notes: string | null
}

/**
 * Inserts one task per field_id with identical metadata; logs task.created for each.
 */
export async function createTasksFromFields(
  supabase: SupabaseClient<Database>,
  input: CreateTasksInput,
): Promise<string[]> {
  const { data: me, error: meErr } = await supabase.rpc('current_person_id')
  if (meErr) {
    throw meErr
  }
  if (!me) {
    throw new Error('current_person_id: empty')
  }

  const rows = input.fieldIds.map((fieldId) => ({
    activity: input.activityText,
    field_id: fieldId,
    assignee_id: input.assigneeId,
    created_by: me,
    due_date: input.dueDate,
    priority: input.priority,
    status: 'TODO' as const,
    notes: input.notes,
  }))

  const { data: inserted, error: insErr } = await supabase.from('tasks').insert(rows).select('id')
  if (insErr) {
    throw insErr
  }
  if (!inserted?.length) {
    throw new Error('tasks insert returned no rows')
  }

  for (const row of inserted) {
    await logActivity(supabase, {
      actorId: me,
      action: 'task.created',
      subjectType: 'task',
      subjectId: row.id,
      payload: {},
    })
  }

  return inserted.map((r) => r.id)
}
