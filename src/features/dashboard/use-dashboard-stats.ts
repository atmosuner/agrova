/* eslint-disable lingui/no-unlocalized-strings */
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { todayISODateInIstanbul } from '@/lib/date-istanbul'

const statsKey = (today: string) => ['dashboard-stats', today] as const

export function useDashboardStats() {
  const qc = useQueryClient()
  const today = todayISODateInIstanbul()
  const q = useQuery({
    queryKey: statsKey(today),
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
      const fieldIds = new Set((taskRows ?? []).map((r) => r.field_id).filter(Boolean) as string[])
      return {
        openTasksToday: openTasks ?? 0,
        openIssues: openIssues ?? 0,
        activeFieldsToday: fieldIds.size,
        activeFieldIds: [...fieldIds],
      }
    },
  })
  useEffect(() => {
    const ch = supabase
      .channel('dashboard-stats-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        void qc.invalidateQueries({ queryKey: statsKey(today) })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'issues' }, () => {
        void qc.invalidateQueries({ queryKey: statsKey(today) })
      })
      .subscribe()
    return () => {
      void supabase.removeChannel(ch)
    }
  }, [qc, today])
  return q
}
