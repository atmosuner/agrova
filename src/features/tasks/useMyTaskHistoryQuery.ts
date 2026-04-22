/* eslint-disable lingui/no-unlocalized-strings */
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useMyPersonQuery } from '@/features/people/useMyPersonQuery'
import { supabase } from '@/lib/supabase'
import type { TaskListRow } from '@/features/tasks/useTasksQuery'

const PAGE = 50

export type MyTaskHistoryRow = TaskListRow & {
  completed_at: string | null
  updated_at: string
}

export function useMyTaskHistoryQuery() {
  const { data: me } = useMyPersonQuery()
  const personId = me?.id
  const [limit, setLimit] = useState(PAGE)

  const query = useQuery({
    queryKey: ['my-task-history', personId, limit],
    enabled: Boolean(personId),
    queryFn: async () => {
      if (!personId) {
        return { rows: [] as MyTaskHistoryRow[] }
      }
      const { data, error } = await supabase
        .from('tasks')
        .select(
          `id, activity, status, priority, due_date, field_id, assignee_id, completed_at, updated_at, fields ( name ), assignee:people!tasks_assignee_id_fkey ( id, full_name )`,
        )
        .eq('assignee_id', personId)
        .in('status', ['DONE', 'CANCELLED', 'BLOCKED'])
        .order('updated_at', { ascending: false })
        .limit(limit)
      if (error) {
        throw error
      }
      return { rows: (data ?? []) as MyTaskHistoryRow[] }
    },
  })

  return {
    ...query,
    limit,
    loadOlder: () => setLimit((l) => l + PAGE),
  }
}
