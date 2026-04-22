/* eslint-disable lingui/no-unlocalized-strings -- PostgREST */
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/db'

export type TaskLinkedIssueRow = Pick<
  Tables<'issues'>,
  'id' | 'category' | 'created_at' | 'photo_url' | 'voice_note_url' | 'resolved_at'
> & {
  reporter: { full_name: string } | null
}

export function useTaskLinkedIssuesQuery(taskId: string | null) {
  return useQuery({
    queryKey: ['task', taskId, 'linked_issues'],
    enabled: Boolean(taskId),
    queryFn: async () => {
      if (!taskId) {
        throw new Error('taskId required')
      }
      const { data, error } = await supabase
        .from('issues')
        .select(
          `id, category, created_at, photo_url, voice_note_url, resolved_at,
          reporter:people!issues_reporter_id_fkey ( full_name )`,
        )
        .eq('task_id', taskId)
        .order('created_at', { ascending: false })
      if (error) {
        throw error
      }
      return (data ?? []) as TaskLinkedIssueRow[]
    },
  })
}
