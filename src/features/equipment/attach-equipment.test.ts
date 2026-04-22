import { beforeEach, describe, expect, it, vi } from 'vitest'

const queueTaskEquipmentChange = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
vi.mock('@/features/tasks/worker-mutations', () => ({ queueTaskEquipmentChange }))

import { toggleTaskEquipmentAttachment } from './attach-equipment'

describe('toggleTaskEquipmentAttachment', () => {
  beforeEach(() => {
    queueTaskEquipmentChange.mockClear()
  })

  it('queues attach', async () => {
    await toggleTaskEquipmentAttachment({ taskId: 't1', equipmentId: 'e1', nextAttached: true })
    expect(queueTaskEquipmentChange).toHaveBeenCalledWith({
      taskId: 't1',
      equipmentId: 'e1',
      op: 'attach',
    })
  })

  it('queues detach', async () => {
    await toggleTaskEquipmentAttachment({ taskId: 't1', equipmentId: 'e1', nextAttached: false })
    expect(queueTaskEquipmentChange).toHaveBeenCalledWith({
      taskId: 't1',
      equipmentId: 'e1',
      op: 'detach',
    })
  })
})
