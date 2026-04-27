/* eslint-disable lingui/no-unlocalized-strings */
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const QUERY_KEY = ['sidebar', 'open-issue-count'] as const

export function useOpenIssueCount(): number {
  const qc = useQueryClient()
  const { data } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('issues')
        .select('id', { count: 'exact', head: true })
        .is('resolved_at', null)
      if (error) throw error
      return count ?? 0
    },
  })
  useEffect(() => {
    const ch = supabase
      .channel('sidebar-open-issues-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'issues' }, () => {
        void qc.invalidateQueries({ queryKey: QUERY_KEY })
      })
      .subscribe()
    return () => {
      void supabase.removeChannel(ch)
    }
  }, [qc])
  return data ?? 0
}
