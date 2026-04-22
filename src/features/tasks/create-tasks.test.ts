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

  it('throws when current_person_id is empty with no error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null })
    await expect(
      createTasksFromFields(supabase, {
        fieldIds: ['f'],
        activityText: 'x',
        assigneeId: 'w',
        dueDate: '2026-04-22',
        priority: 'LOW',
        notes: null,
      }),
    ).rejects.toThrow('current_person_id: empty')
  })

  it('throws on tasks insert error', async () => {
    mockRpc.mockResolvedValue({ data: 'me-id', error: null })
    const insert = vi.fn().mockReturnValue({
      select: () => Promise.resolve({ data: null, error: { message: 'insert-fail' } }),
    })
    mockFrom.mockImplementation((t: string) => (t === 'tasks' ? { insert } : { insert: vi.fn() }))
    await expect(
      createTasksFromFields(supabase, {
        fieldIds: ['f1'],
        activityText: 'a',
        assigneeId: 'w1',
        dueDate: '2026-04-22',
        priority: 'LOW',
        notes: null,
      }),
    ).rejects.toEqual(expect.objectContaining({ message: 'insert-fail' }))
  })

  it('throws when insert returns no rows', async () => {
    mockRpc.mockResolvedValue({ data: 'me-id', error: null })
    const insert = vi.fn().mockReturnValue({
      select: () => Promise.resolve({ data: [], error: null }),
    })
    mockFrom.mockImplementation((t: string) => (t === 'tasks' ? { insert } : { insert: vi.fn() }))
    await expect(
      createTasksFromFields(supabase, {
        fieldIds: ['f1'],
        activityText: 'a',
        assigneeId: 'w1',
        dueDate: '2026-04-22',
        priority: 'LOW',
        notes: null,
      }),
    ).rejects.toThrow('tasks insert returned no rows')
  })
})
