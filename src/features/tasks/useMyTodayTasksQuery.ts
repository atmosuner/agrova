/* eslint-disable lingui/no-unlocalized-strings */
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useMyPersonQuery } from '@/features/people/useMyPersonQuery'
import { todayISODateInIstanbul } from '@/lib/date-istanbul'
import { supabase } from '@/lib/supabase'
import type { TaskListRow } from '@/features/tasks/useTasksQuery'

export function useMyTodayTasksQuery() {
  const { data: me } = useMyPersonQuery()
  const personId = me?.id
  const today = useMemo(() => todayISODateInIstanbul(), [])

  return useQuery({
    queryKey: ['my-today-tasks', personId, today],
    enabled: Boolean(personId),
    queryFn: async () => {
      if (!personId) {
        return { rows: [] as TaskListRow[] }
      }
      const { data, error } = await supabase
        .from('tasks')
        .select(
          `id, activity, status, priority, due_date, field_id, assignee_id, fields ( name ), assignee:people!tasks_assignee_id_fkey ( id, full_name )`,
        )
        .eq('assignee_id', personId)
        .eq('due_date', today)
        .order('due_date', { ascending: true })
      if (error) {
        throw error
      }
      return { rows: (data ?? []) as TaskListRow[] }
    },
    placeholderData: (prev) => prev,
  })
}
