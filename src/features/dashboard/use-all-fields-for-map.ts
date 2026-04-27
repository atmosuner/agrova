/* eslint-disable lingui/no-unlocalized-strings */
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { FieldWithGeo } from '@/features/fields/boundary-geojson'

export const allFieldsMapKey = ['fields', 'map', 'all'] as const

export function useAllFieldsForMap() {
  const qc = useQueryClient()
  const q = useQuery({
    queryKey: allFieldsMapKey,
    queryFn: async (): Promise<FieldWithGeo[]> => {
      const { data, error } = await supabase.from('fields').select('*, boundary_geojson').order('name', { ascending: true })
      if (error) {
        throw error
      }
      return (data ?? []) as unknown as FieldWithGeo[]
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
