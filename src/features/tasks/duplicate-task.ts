/* eslint-disable lingui/no-unlocalized-strings */
import type { SupabaseClient } from '@supabase/supabase-js'
import { logActivity } from '@/features/tasks/log-activity'
import type { Database, Tables } from '@/types/db'
import { addCalendarDaysToIsoDate } from '@/lib/calendar-date'
import { istanbulDateString } from '@/lib/istanbul-date'

type Task = Tables<'tasks'>

/**
 * "Yarın için kopyala" — new task, same field/assignee/meta, due_date +1 day, status TODO.
 */
export async function duplicateTaskForTomorrow(
  supabase: SupabaseClient<Database>,
  input: { task: Task; actorId: string },
): Promise<string> {
  const newDue = addCalendarDaysToIsoDate(istanbulDateString(), 1)
  return duplicateTaskWithDue(supabase, { ...input, fieldId: input.task.field_id, dueDate: newDue })
}

/**
 * "N tarlaya kopyala" — one new task per field_id, from same source task snapshot.
 */
export async function duplicateTaskToFields(
  supabase: SupabaseClient<Database>,
  input: { task: Task; fieldIds: string[]; actorId: string },
): Promise<string[]> {
  if (input.fieldIds.length === 0) {
    return []
  }
  const { data: me, error: meErr } = await supabase.rpc('current_person_id')
  if (meErr) {
    throw meErr
  }
  if (!me) {
    throw new Error('current_person_id')
  }
  const t = input.task
  const rows = input.fieldIds.map((fieldId) => ({
    activity: t.activity,
    field_id: fieldId,
    assignee_id: t.assignee_id,
    created_by: me,
    status: 'TODO' as const,
    priority: t.priority,
    due_date: t.due_date,
    notes: t.notes,
  }))
  const { data: ins, error: insErr } = await supabase.from('tasks').insert(rows).select('id')
  if (insErr) {
    throw insErr
  }
  for (const row of ins ?? []) {
    await logActivity(supabase, {
      actorId: input.actorId,
      action: 'task.duplicated',
      subjectType: 'task',
      subjectId: row.id,
      payload: { source_task_id: t.id },
    })
  }
  return (ins ?? []).map((r) => r.id)
}

async function duplicateTaskWithDue(
  supabase: SupabaseClient<Database>,
  input: { task: Task; fieldId: string; dueDate: string; actorId: string },
): Promise<string> {
  const { data: me, error: meErr } = await supabase.rpc('current_person_id')
  if (meErr) {
    throw meErr
  }
  if (!me) {
    throw new Error('current_person_id')
  }
  const t = input.task
  const { data: ins, error: insErr } = await supabase
    .from('tasks')
    .insert({
      activity: t.activity,
      field_id: input.fieldId,
      assignee_id: t.assignee_id,
      created_by: me,
      status: 'TODO',
      priority: t.priority,
      due_date: input.dueDate,
      notes: t.notes,
    })
    .select('id')
    .single()
  if (insErr) {
    throw insErr
  }
  if (!ins) {
    throw new Error('insert')
  }
  await logActivity(supabase, {
    actorId: input.actorId,
    action: 'task.duplicated',
    subjectType: 'task',
    subjectId: ins.id,
    payload: { source_task_id: t.id },
  })
  return ins.id
}
