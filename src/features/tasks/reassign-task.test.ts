import { describe, expect, it, vi, beforeEach } from 'vitest'
import { reassignTask } from '@/features/tasks/reassign-task'

const mockRpc = vi.fn()

const supabase = {
  rpc: (...args: unknown[]) => mockRpc(...args),
} as never

describe('reassignTask', () => {
  beforeEach(() => {
    mockRpc.mockReset()
  })

  it('calls reassign_task rpc', async () => {
    mockRpc.mockResolvedValue({ error: null })
    await reassignTask(supabase, { taskId: 'tttttttt-tttt-tttt-tttt-tttttttttttt', newAssigneeId: 'uuuuuuuu-uuuu-uuuu-uuuu-uuuuuuuuuuuu' })
    expect(mockRpc).toHaveBeenCalledWith('reassign_task', {
      p_task_id: 'tttttttt-tttt-tttt-tttt-tttttttttttt',
      p_new_assignee: 'uuuuuuuu-uuuu-uuuu-uuuu-uuuuuuuuuuuu',
    })
  })

  it('rethrows rpc errors', async () => {
    mockRpc.mockResolvedValue({ error: { message: 'policy' } })
    await expect(
      reassignTask(supabase, { taskId: 'a', newAssigneeId: 'b' }),
    ).rejects.toEqual(expect.objectContaining({ message: 'policy' }))
  })
})
