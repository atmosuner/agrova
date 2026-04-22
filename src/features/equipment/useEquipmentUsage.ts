/* eslint-disable lingui/no-unlocalized-strings */
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export type EquipmentUsageRow = {
  task_id: string
  attached_at: string
  field_name: string | null
  task_due: string
  task_activity: string
  attached_by_name: string | null
}

function isoThirtyDaysAgo(): string {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d.toISOString()
}

export function useEquipmentUsageQuery(equipmentId: string | null) {
  return useQuery({
    queryKey: ['equipment-usage', equipmentId],
    enabled: Boolean(equipmentId),
    queryFn: async () => {
      if (!equipmentId) {
        throw new Error('equipmentId required')
      }
      const { data, error: listErr } = await supabase
        .from('task_equipment')
        .select(
          'task_id, attached_at, tasks ( due_date, activity, fields ( name ) ), people!task_equipment_attached_by_fkey ( full_name )',
        )
        .eq('equipment_id', equipmentId)
        .order('attached_at', { ascending: false })
        .limit(50)
      if (listErr) {
        throw listErr
      }
      const { count: countAll, error: allErr } = await supabase
        .from('task_equipment')
        .select('task_id', { count: 'exact', head: true })
        .eq('equipment_id', equipmentId)
      if (allErr) {
        throw allErr
      }
      const since = isoThirtyDaysAgo()
      const { count: count30, error: tErr } = await supabase
        .from('task_equipment')
        .select('task_id', { count: 'exact', head: true })
        .eq('equipment_id', equipmentId)
        .gte('attached_at', since)
      if (tErr) {
        throw tErr
      }
      const rows: EquipmentUsageRow[] = (data ?? []).map((r) => {
        const t = r.tasks as {
          due_date: string
          activity: string
          fields: { name: string } | null
        } | null
        const p = r.people as { full_name: string } | null
        return {
          task_id: r.task_id,
          attached_at: r.attached_at,
          field_name: t?.fields?.name ?? null,
          task_due: t?.due_date ?? '',
          task_activity: t?.activity ?? '',
          attached_by_name: p?.full_name ?? null,
        }
      })
      return {
        rows,
        countLast30: count30 ?? 0,
        countAll: countAll ?? 0,
      }
    },
  })
}
