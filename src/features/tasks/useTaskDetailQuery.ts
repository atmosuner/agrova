/* eslint-disable lingui/no-unlocalized-strings -- query keys / PostgREST */
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/db'

export type TaskDetail = Tables<'tasks'> & {
  fields: { id: string; name: string } | null
  assignee: { id: string; full_name: string } | null
}

export function useTaskDetailQuery(taskId: string | null) {
  return useQuery({
    queryKey: ['task', taskId],
    enabled: Boolean(taskId),
    queryFn: async () => {
      if (!taskId) {
        throw new Error('taskId required')
      }
      const { data, error } = await supabase
        .from('tasks')
        .select(
          `*, fields ( id, name ), assignee:people!tasks_assignee_id_fkey ( id, full_name )`,
        )
        .eq('id', taskId)
        .maybeSingle()
      if (error) {
        throw error
      }
      if (!data) {
        throw new Error('task not found')
      }
      return data as TaskDetail
    },
  })
}
