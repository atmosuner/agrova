/* eslint-disable lingui/no-unlocalized-strings */
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export type FieldChemicalRow = {
  id: string
  task_id: string
  applied_at: string
  task_activity: string
  applicator_name: string | null
}

export function useFieldChemicalApplicationsQuery(fieldId: string | null) {
  return useQuery({
    queryKey: ['field-chemicals', fieldId],
    enabled: Boolean(fieldId),
    queryFn: async () => {
      if (!fieldId) {
        throw new Error('fieldId required')
      }
      const { data, error } = await supabase
        .from('chemical_applications')
        .select('id, task_id, applied_at, tasks ( activity ), people!chemical_applications_applicator_id_fkey ( full_name )')
        .eq('field_id', fieldId)
        .order('applied_at', { ascending: false })
      if (error) {
        throw error
      }
      return (data ?? []).map((r) => {
        const t = r.tasks as { activity: string } | null
        const p = r.people as { full_name: string } | null
        return {
          id: r.id,
          task_id: r.task_id,
          applied_at: r.applied_at,
          task_activity: t?.activity ?? '',
          applicator_name: p?.full_name ?? null,
        } satisfies FieldChemicalRow
      })
    },
  })
}
