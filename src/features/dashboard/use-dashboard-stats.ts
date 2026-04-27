/* eslint-disable lingui/no-unlocalized-strings */
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { todayISODateInIstanbul } from '@/lib/date-istanbul'

const statsKey = (today: string) => ['dashboard-stats', today] as const

function yesterdayISO(today: string): string {
  const d = new Date(`${today}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

export function useDashboardStats() {
  const qc = useQueryClient()
  const today = todayISODateInIstanbul()
  const yesterday = yesterdayISO(today)
  const q = useQuery({
    queryKey: statsKey(today),
    queryFn: async () => {
      const [
        { count: openTasks, error: e1 },
        { count: openIssues, error: e2 },
        { data: taskRows, error: e3 },
        { count: yOpenTasks, error: e4 },
        { count: yOpenIssues, error: e5 },
      ] = await Promise.all([
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
        supabase
          .from('tasks')
          .select('id', { count: 'exact', head: true })
          .eq('due_date', yesterday)
          .in('status', ['TODO', 'IN_PROGRESS', 'BLOCKED']),
        supabase.from('issues').select('id', { count: 'exact', head: true }).is('resolved_at', null),
      ])
      const err = e1 || e2 || e3 || e4 || e5
      if (err) {
        throw err
      }
      const fieldIds = new Set((taskRows ?? []).map((r) => r.field_id).filter(Boolean) as string[])
      return {
        openTasksToday: openTasks ?? 0,
        openIssues: openIssues ?? 0,
        activeFieldsToday: fieldIds.size,
        activeFieldIds: [...fieldIds],
        yesterdayOpenTasks: yOpenTasks ?? 0,
        yesterdayOpenIssues: yOpenIssues ?? 0,
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
