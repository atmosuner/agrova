/* eslint-disable lingui/no-unlocalized-strings */
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Enums, Tables } from '@/types/db'

export type EquipmentListItem = Pick<Tables<'equipment'>, 'id' | 'name' | 'category' | 'active'>

export function useActiveEquipmentQuery() {
  return useQuery({
    queryKey: ['equipment', 'active', 'all'],
    queryFn: async (): Promise<EquipmentListItem[]> => {
      const { data, error } = await supabase
        .from('equipment')
        .select('id, name, category, active')
        .eq('active', true)
        .order('name', { ascending: true })
      if (error) {
        throw error
      }
      return (data ?? []) as EquipmentListItem[]
    },
  })
}

export const EQUIPMENT_TAB_ORDER: Enums<'equipment_category'>[] = ['VEHICLE', 'TOOL', 'CHEMICAL', 'CRATE']
