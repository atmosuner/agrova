/* eslint-disable lingui/no-unlocalized-strings -- query keys and PostgREST */
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/db'
import type { TasksSearchState } from '@/features/tasks/tasks-search'

const PAGE = 50

export type TaskListRow = Pick<
  Tables<'tasks'>,
  'id' | 'activity' | 'status' | 'priority' | 'due_date' | 'field_id' | 'assignee_id'
> & {
  fields: { name: string } | null
  assignee: { id: string; full_name: string } | null
}

type Args = { search: TasksSearchState }

const KANBAN_CAP = 200

export function useTasksQuery({ search }: Args) {
  const { status, field, assignee, activity, dueFrom, dueTo, page } = search
  const { view } = search

  return useQuery({
    queryKey: [
      'tasks',
      { status, field, assignee, activity, dueFrom, dueTo, page, view: search.view },
    ],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let q = supabase
        .from('tasks')
        .select(
          `id, activity, status, priority, due_date, field_id, assignee_id, fields ( name ), assignee:people!tasks_assignee_id_fkey ( id, full_name )`,
          { count: 'exact' },
        )
        .order('due_date', { ascending: true })
      if (view === 'kanban') {
        q = q.limit(KANBAN_CAP)
      } else {
        const rFrom = page * PAGE
        const rTo = rFrom + PAGE - 1
        q = q.range(rFrom, rTo)
      }
      if (status) {
        q = q.eq('status', status)
      }
      if (field) {
        q = q.eq('field_id', field)
      }
      if (assignee) {
        q = q.eq('assignee_id', assignee)
      }
      if (activity) {
        q = q.eq('activity', activity)
      }
      if (dueFrom) {
        q = q.gte('due_date', dueFrom)
      }
      if (dueTo) {
        q = q.lte('due_date', dueTo)
      }
      const { data, error, count } = await q
      if (error) {
        throw error
      }
      return { rows: (data ?? []) as TaskListRow[], total: count ?? 0 }
    },
  })
}

export const TASKS_PAGE_SIZE = PAGE
