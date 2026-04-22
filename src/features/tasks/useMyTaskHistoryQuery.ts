/* eslint-disable lingui/no-unlocalized-strings */
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useMyPersonQuery } from '@/features/people/useMyPersonQuery'
import { addDaysToISODate, thisWeekRangeISODateInIstanbul } from '@/lib/date-istanbul'
import { supabase } from '@/lib/supabase'
import type { TaskListRow } from '@/features/tasks/useTasksQuery'

const DEFAULT_DAYS_BACK = 21
const PAGE_DAYS = 7

export function useMyTaskHistoryQuery() {
  const { data: me } = useMyPersonQuery()
  const personId = me?.id
  const { start: weekStart, end: weekEnd } = useMemo(() => thisWeekRangeISODateInIstanbul(), [])
  const [daysBack, setDaysBack] = useState(DEFAULT_DAYS_BACK)

  const fromDate = addDaysToISODate(weekStart, -daysBack)

  const query = useQuery({
    queryKey: ['my-task-history', personId, fromDate, weekEnd],
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
        .gte('due_date', fromDate)
        .lte('due_date', weekEnd)
        .order('due_date', { ascending: false })
      if (error) {
        throw error
      }
      return { rows: (data ?? []) as TaskListRow[] }
    },
  })

  return {
    ...query,
    fromDate,
    weekEnd,
    loadOlder: () => setDaysBack((d) => d + PAGE_DAYS),
  }
}
