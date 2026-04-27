/* eslint-disable lingui/no-unlocalized-strings -- query keys / PostgREST */
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/db'

export type TaskLogRow = Pick<Tables<'activity_log'>, 'id' | 'action' | 'payload' | 'created_at'> & {
  actor: { full_name: string } | null
}

export function useTaskActivityLogQuery(taskId: string | null) {
  return useQuery({
    queryKey: ['task', taskId, 'activity_log'],
    enabled: Boolean(taskId),
    queryFn: async () => {
      if (!taskId) {
        throw new Error('taskId required')
      }
      const { data, error } = await supabase
        .from('activity_log')
        .select(`id, action, payload, created_at, actor:people!activity_log_actor_id_fkey ( full_name )`)
        .eq('subject_type', 'task')
        .eq('subject_id', taskId)
        .order('created_at', { ascending: false })
      if (error) {
        throw error
      }
      return (data ?? []) as TaskLogRow[]
    },
  })
}
