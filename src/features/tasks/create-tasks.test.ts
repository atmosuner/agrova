import { describe, expect, it, vi, beforeEach } from 'vitest'
import { createTasksFromFields } from '@/features/tasks/create-tasks'

const mockRpc = vi.fn()
const mockFrom = vi.fn()
const fanout = vi.fn()

vi.mock('@/lib/invoke-web-push-fanout', () => ({
  invokeWebPushFanout: (...args: unknown[]) => fanout(...args),
}))

const supabase = { rpc: (...a: unknown[]) => mockRpc(...a), from: mockFrom } as never

describe('createTasksFromFields', () => {
  beforeEach(() => {
    mockRpc.mockReset()
    mockFrom.mockReset()
    fanout.mockReset()
    mockRpc.mockResolvedValue({ data: 'me-id', error: null })
  })

  it('inserts one row per field and logs task.created for each', async () => {
    const insert = vi.fn().mockReturnValue({
      select: () => Promise.resolve({ data: [{ id: 't1' }, { id: 't2' }], error: null }),
    })
    const alInsert = vi.fn().mockReturnValue({
      select: () => ({
        single: () => Promise.resolve({ data: { id: 'a1' }, error: null }),
      }),
    })
    mockFrom.mockImplementation((t: string) => {
      if (t === 'activity_log') {
        return { insert: alInsert }
      }
      return { insert }
    })

    const ids = await createTasksFromFields(supabase, {
      fieldIds: ['f1', 'f2'],
      activityText: 'Budama',
      assigneeId: 'w1',
      dueDate: '2026-04-23',
      priority: 'NORMAL',
      notes: null,
    })
    expect(ids).toEqual(['t1', 't2'])
    expect(insert).toHaveBeenCalledOnce()
    expect(alInsert).toHaveBeenCalledTimes(2)
  })

  it('throws when current_person_id fails', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'nope' } })
    await expect(
      createTasksFromFields(supabase, {
        fieldIds: ['f'],
        activityText: 'x',
        assigneeId: 'w',
        dueDate: '2026-04-22',
        priority: 'LOW',
        notes: null,
      }),
    ).rejects.toEqual(expect.objectContaining({ message: 'nope' }))
  })
})
