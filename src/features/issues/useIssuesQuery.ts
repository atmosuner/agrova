/* eslint-disable lingui/no-unlocalized-strings -- PostgREST */
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Enums } from '@/types/db'

export type IssueListRow = {
  id: string
  category: Enums<'issue_category'>
  created_at: string
  photo_url: string | null
  voice_note_url: string | null
  resolved_at: string | null
  resolved_by: string | null
  task_id: string | null
  field_id: string | null
  reporter: { full_name: string } | null
  resolver: { full_name: string } | null
  field: { name: string } | null
}

export const issuesListQueryKey = ['owner', 'issues'] as const

export function useIssuesListQuery() {
  return useQuery({
    queryKey: issuesListQueryKey,
    queryFn: async (): Promise<IssueListRow[]> => {
      const { data, error } = await supabase
        .from('issues')
        .select(
          `
          id,
          category,
          created_at,
          photo_url,
          voice_note_url,
          resolved_at,
          resolved_by,
          task_id,
          field_id,
          reporter:people!issues_reporter_id_fkey ( full_name ),
          resolver:people!issues_resolved_by_fkey ( full_name ),
          field:fields!issues_field_id_fkey ( name )
        `,
        )
        .order('created_at', { ascending: false })
      if (error) {
        throw error
      }
      return (data ?? []) as IssueListRow[]
    },
  })
}

export function useIssuesRealtime() {
  const qc = useQueryClient()
  useEffect(() => {
    const channel = supabase
      .channel('issues-owner-feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'issues' },
        () => void qc.invalidateQueries({ queryKey: issuesListQueryKey }),
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [qc])
}
