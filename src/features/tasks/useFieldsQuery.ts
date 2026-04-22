/* eslint-disable lingui/no-unlocalized-strings -- TanStack Query key and PostgREST select */
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/db'

export type FieldRow = Pick<Tables<'fields'>, 'id' | 'name' | 'crop'>

export function useFieldsQuery() {
  return useQuery({
    queryKey: ['fields', 'catalog'],
    queryFn: async (): Promise<FieldRow[]> => {
      const { data, error } = await supabase
        .from('fields')
        .select('id,name,crop')
        .order('name', { ascending: true })
      if (error) {
        throw error
      }
      return data ?? []
    },
  })
}
