/* eslint-disable lingui/no-unlocalized-strings */
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { todayISODateInIstanbul } from '@/lib/date-istanbul'

export function useDashboardStats() {
  const today = todayISODateInIstanbul()
  return useQuery({
    queryKey: ['dashboard-stats', today],
    queryFn: async () => {
      const [{ count: openTasks, error: e1 }, { count: openIssues, error: e2 }, { data: taskRows, error: e3 }] =
        await Promise.all([
          supabase
            .from('tasks')
            .select('id', { count: 'exact', head: true })
            .eq('due_date', today)
            .in('status', ['TODO', 'IN_PROGRESS', 'BLOCKED']),
          supabase.from('issues').select('id', { count: 'exact', head: true }).is('resolved_at', null),
          supabase
            .from('tasks')
            .select('field_id')
            .eq('due_date', today)
            .in('status', ['TODO', 'IN_PROGRESS', 'BLOCKED']),
        ])
      if (e1) {
        throw e1
      }
      if (e2) {
        throw e2
      }
      if (e3) {
        throw e3
      }
      const fieldIds = new Set((taskRows ?? []).map((r) => r.field_id).filter(Boolean))
      return {
        openTasksToday: openTasks ?? 0,
        openIssues: openIssues ?? 0,
        activeFieldsToday: fieldIds.size,
      }
    },
  })
}
