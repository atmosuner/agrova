/* eslint-disable lingui/no-unlocalized-strings -- query keys / PostgREST */
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Enums, Tables } from '@/types/db'

export type TaskDetail = Tables<'tasks'> & {
  fields: { id: string; name: string; crop: string } | null
  assignee: { id: string; full_name: string } | null
  task_equipment: TaskEquipmentRow[]
}

export type TaskEquipmentRow = {
  equipment_id: string
  attached_at: string
  equipment: {
    id: string
    name: string
    category: Enums<'equipment_category'>
    active: boolean
  } | null
}

export function useTaskDetailQuery(taskId: string | null) {
  return useQuery({
    queryKey: ['task', taskId],
    enabled: Boolean(taskId),
    queryFn: async () => {
      if (!taskId) {
        throw new Error('taskId required')
      }
      const { data, error } = await supabase
        .from('tasks')
        .select(
          `*, fields ( id, name, crop ), assignee:people!tasks_assignee_id_fkey ( id, full_name ),
          task_equipment ( equipment_id, attached_at, equipment:equipment!task_equipment_equipment_id_fkey ( id, name, category, active ) )`,
        )
        .eq('id', taskId)
        .maybeSingle()
      if (error) {
        throw error
      }
      if (!data) {
        throw new Error('task not found')
      }
      const row = data as TaskDetail & { task_equipment: TaskEquipmentRow[] | null }
      return {
        ...row,
        task_equipment: row.task_equipment ?? [],
      }
    },
  })
}
