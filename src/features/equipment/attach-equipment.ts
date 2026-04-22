/* eslint-disable lingui/no-unlocalized-strings -- outbox op codes */
import { queueTaskEquipmentChange } from '@/features/tasks/worker-mutations'

export async function toggleTaskEquipmentAttachment(input: {
  taskId: string
  equipmentId: string
  nextAttached: boolean
}): Promise<void> {
  await queueTaskEquipmentChange({
    taskId: input.taskId,
    equipmentId: input.equipmentId,
    op: input.nextAttached ? 'attach' : 'detach',
  })
}
