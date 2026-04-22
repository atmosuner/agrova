/* eslint-disable lingui/no-unlocalized-strings -- URL search param keys and task status slugs */
import type { Enums } from '@/types/db'

export type TasksViewMode = 'table' | 'kanban'

export type TasksSearchState = {
  status: Enums<'task_status'> | null
  field: string | null
  assignee: string | null
  activity: string | null
  dueFrom: string | null
  dueTo: string | null
  page: number
  view: TasksViewMode
  task: string | null
}

const STATUSES: Enums<'task_status'>[] = ['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED', 'CANCELLED']

function isTaskStatus(s: string): s is Enums<'task_status'> {
  return (STATUSES as string[]).includes(s)
}

export const defaultTasksSearch = (): TasksSearchState => ({
  status: null,
  field: null,
  assignee: null,
  activity: null,
  dueFrom: null,
  dueTo: null,
  page: 0,
  view: 'table',
  task: null,
})

/** Dashboard / deep links: tasks due on a single calendar day (Istanbul). */
export function tasksSearchDueOn(isoDate: string): TasksSearchState {
  return { ...defaultTasksSearch(), dueFrom: isoDate, dueTo: isoDate }
}

export function parseTasksSearch(raw: Record<string, unknown>): TasksSearchState {
  const d = defaultTasksSearch()
  const status = typeof raw.status === 'string' && isTaskStatus(raw.status) ? raw.status : d.status
  const field = typeof raw.field === 'string' && raw.field.length > 0 ? raw.field : d.field
  const assignee = typeof raw.assignee === 'string' && raw.assignee.length > 0 ? raw.assignee : d.assignee
  const activity = typeof raw.activity === 'string' && raw.activity.length > 0 ? raw.activity : d.activity
  const dueFrom = typeof raw.dueFrom === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.dueFrom) ? raw.dueFrom : d.dueFrom
  const dueTo = typeof raw.dueTo === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.dueTo) ? raw.dueTo : d.dueTo
  const page = typeof raw.page === 'string' && /^\d+$/.test(raw.page) ? Math.max(0, parseInt(raw.page, 10)) : d.page
  const view = raw.view === 'kanban' ? 'kanban' : 'table'
  const task = typeof raw.task === 'string' && raw.task.length > 0 ? raw.task : d.task
  return {
    status,
    field,
    assignee,
    activity,
    dueFrom,
    dueTo,
    page,
    view,
    task,
  }
}
