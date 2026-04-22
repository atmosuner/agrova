import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  queueTaskStatusChange,
  queueTaskReassign,
  queueTaskCompletionWithOptionalPhoto,
  queueTaskEquipmentChange,
} from '@/features/tasks/worker-mutations'

const mockBlobsAdd = vi.fn()
const mockEnqueue = vi.fn()
const mockDrain = vi.fn()

vi.mock('@/lib/db', () => ({
  db: {
    blobs: {
      add: (...args: unknown[]) => mockBlobsAdd(...args),
    },
  },
}))

vi.mock('@/lib/sync', () => ({
  enqueueOutbox: (...args: unknown[]) => mockEnqueue(...args),
  drainOutbox: () => mockDrain(),
}))

describe('worker-mutations (outbox contract)', () => {
  beforeEach(() => {
    mockBlobsAdd.mockReset()
    mockEnqueue.mockReset()
    mockDrain.mockReset()
    mockEnqueue.mockResolvedValue('ob')
  })

  it('queueTaskStatusChange enqueues task_status then drains', async () => {
    await queueTaskStatusChange({ taskId: 't1', fromStatus: 'TODO', toStatus: 'IN_PROGRESS' })
    expect(mockEnqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'task_status',
        payload: expect.objectContaining({ taskId: 't1', toStatus: 'IN_PROGRESS' }),
      }),
    )
    expect(mockDrain).toHaveBeenCalled()
  })

  it('queueTaskReassign enqueues task_reassign', async () => {
    await queueTaskReassign({ taskId: 't1', newAssigneeId: 'p2' })
    expect(mockEnqueue).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'task_reassign', payload: { taskId: 't1', newAssigneeId: 'p2' } }),
    )
  })

  it('queueTaskCompletionWithOptionalPhoto enqueues with blobId when file present', async () => {
    mockBlobsAdd.mockResolvedValue(undefined)
    const file = new File(['x'], 'p.jpg', { type: 'image/jpeg' })
    await queueTaskCompletionWithOptionalPhoto({ taskId: 't1', fromStatus: 'IN_PROGRESS', file })
    expect(mockBlobsAdd).toHaveBeenCalledOnce()
    const call = mockEnqueue.mock.calls[0]?.[0] as { kind: string; payload: { blobId?: string } }
    expect(call.kind).toBe('task_completion')
    expect(call.payload['blobId']).toBeTypeOf('string')
  })

  it('queueTaskEquipmentChange enqueues task_equipment', async () => {
    await queueTaskEquipmentChange({ taskId: 't1', equipmentId: 'e1', op: 'detach' })
    expect(mockEnqueue).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'task_equipment', payload: { taskId: 't1', equipmentId: 'e1', op: 'detach' } }),
    )
  })
})
