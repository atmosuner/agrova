/* eslint-disable lingui/no-unlocalized-strings */
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { todayISODateInIstanbul } from '@/lib/date-istanbul'
import { supabase } from '@/lib/supabase'
import type { Enums, Tables } from '@/types/db'

export type BoardTaskRow = Pick<Tables<'tasks'>, 'id' | 'activity' | 'status' | 'priority' | 'due_date' | 'field_id' | 'assignee_id'> & {
  fields: { name: string } | null
  assignee: { id: string; full_name: string } | null
}

export function todaysBoardKey() {
  return ['todays-board', todayISODateInIstanbul()] as const
}

export function useTodaysBoardTasks() {
  const qc = useQueryClient()
  const day = todayISODateInIstanbul()
  const q = useQuery({
    queryKey: todaysBoardKey(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(
          'id, activity, status, priority, due_date, field_id, assignee_id, fields ( name ), assignee:people!tasks_assignee_id_fkey ( id, full_name )',
        )
        .eq('due_date', day)
        .in('status', ['TODO', 'IN_PROGRESS', 'DONE'])
        .order('created_at', { ascending: true })
        .limit(30)
      if (error) {
        throw error
      }
      return (data ?? []) as BoardTaskRow[]
    },
  })
  useEffect(() => {
    const ch = supabase
      .channel('todays-board-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        void qc.invalidateQueries({ queryKey: todaysBoardKey() })
      })
      .subscribe()
    return () => {
      void supabase.removeChannel(ch)
    }
  }, [qc, day])
  return q
}

export function columnForStatus(s: Enums<'task_status'>): 'TODO' | 'IN_PROGRESS' | 'DONE' | null {
  if (s === 'TODO') {
    return 'TODO'
  }
  if (s === 'IN_PROGRESS') {
    return 'IN_PROGRESS'
  }
  if (s === 'DONE') {
    return 'DONE'
  }
  return null
}
