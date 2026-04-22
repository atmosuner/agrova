/* eslint-disable lingui/no-unlocalized-strings -- query key + PostgREST */
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/db'

type Row = Pick<Tables<'people'>, 'id' | 'full_name' | 'role'>

export function useAssignablePeopleQuery() {
  return useQuery({
    queryKey: ['people', 'assignable'],
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await supabase
        .from('people')
        .select('id,full_name,role')
        .neq('role', 'OWNER')
        .eq('active', true)
        .order('full_name', { ascending: true })
      if (error) {
        throw error
      }
      return data ?? []
    },
  })
}
