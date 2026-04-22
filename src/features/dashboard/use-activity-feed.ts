/* eslint-disable lingui/no-unlocalized-strings */
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/db'

export type ActivityFeedRow = Pick<Tables<'activity_log'>, 'id' | 'action' | 'subject_type' | 'subject_id' | 'created_at'> & {
  actor: { id: string; full_name: string } | null
}

export const activityFeedKey = ['activity-feed', 20] as const

export function useActivityFeed() {
  const qc = useQueryClient()
  const q = useQuery({
    queryKey: activityFeedKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_log')
        .select('id, action, subject_type, subject_id, created_at, actor:people!activity_log_actor_id_fkey ( id, full_name )')
        .order('created_at', { ascending: false })
        .limit(20)
      if (error) {
        throw error
      }
      return (data ?? []) as ActivityFeedRow[]
    },
  })
  useEffect(() => {
    const ch = supabase
      .channel('activity-feed-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_log' }, () => {
        void qc.invalidateQueries({ queryKey: activityFeedKey })
      })
      .subscribe()
    return () => {
      void supabase.removeChannel(ch)
    }
  }, [qc])
  return q
}
