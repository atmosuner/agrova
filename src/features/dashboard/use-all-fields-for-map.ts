/* eslint-disable lingui/no-unlocalized-strings */
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/db'

export const allFieldsMapKey = ['fields', 'map', 'all'] as const

export function useAllFieldsForMap() {
  const qc = useQueryClient()
  const q = useQuery({
    queryKey: allFieldsMapKey,
    queryFn: async (): Promise<Tables<'fields'>[]> => {
      const { data, error } = await supabase.from('fields').select('*').order('name', { ascending: true })
      if (error) {
        throw error
      }
      return data ?? []
    },
  })
  useEffect(() => {
    const ch = supabase
      .channel('fields-map-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fields' }, () => {
        void qc.invalidateQueries({ queryKey: allFieldsMapKey })
      })
      .subscribe()
    return () => {
      void supabase.removeChannel(ch)
    }
  }, [qc])
  return q
}
