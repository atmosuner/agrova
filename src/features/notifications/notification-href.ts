import type { InboxRow } from '@/features/notifications/use-notifications-inbox'
import { defaultTasksSearch, type TasksSearchState } from '@/features/tasks/tasks-search'

export function inboxRowToTaskLink(row: InboxRow): { to: '/tasks'; search: TasksSearchState } | null {
  const a = row.activity_log
  if (!a || a.subject_type !== 'task') {
    return null
  }
  return { to: '/tasks', search: { ...defaultTasksSearch(), task: a.subject_id } }
}

export function inboxRowToIssueHighlight(row: InboxRow): string | null {
  const a = row.activity_log
  if (!a || a.subject_type !== 'issue') {
    return null
  }
  return a.subject_id
}
