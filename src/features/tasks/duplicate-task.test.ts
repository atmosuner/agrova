import { describe, expect, it, vi, beforeEach } from 'vitest'
import { duplicateTaskToFields, duplicateTaskForTomorrow } from '@/features/tasks/duplicate-task'
import type { Tables } from '@/types/db'

const mockFrom = vi.fn()
const mockRpc = vi.fn()

const fanout = vi.fn()
vi.mock('@/lib/invoke-web-push-fanout', () => ({
  invokeWebPushFanout: (...args: unknown[]) => fanout(...args),
}))

const supabase = { from: mockFrom, rpc: (...a: unknown[]) => mockRpc(...a) } as never

const baseTask: Tables<'tasks'> = {
  id: 'src-task',
  activity: 'x',
  field_id: 'f0',
  assignee_id: 'a1',
  created_by: 'c1',
  status: 'DONE',
  priority: 'NORMAL',
  due_date: '2026-04-25',
  notes: null,
  completed_at: null,
  completion_photo_url: null,
} as unknown as Tables<'tasks'>

describe('duplicateTaskToFields', () => {
  beforeEach(() => {
    mockFrom.mockReset()
    mockRpc.mockReset()
    fanout.mockReset()
    mockRpc.mockResolvedValue({ data: 'me', error: null })
  })

  it('returns [] when no target fields', async () => {
    const r = await duplicateTaskToFields(supabase, { task: baseTask, fieldIds: [], actorId: 'x' })
    expect(r).toEqual([])
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('inserts and logs for each new field', async () => {
    const alInsert = vi.fn().mockReturnValue({
      select: () => ({
        single: () => Promise.resolve({ data: { id: 'log1' }, error: null }),
      }),
    })
    const insert = vi.fn().mockReturnValue({
      select: () => Promise.resolve({ data: [{ id: 'n1' }, { id: 'n2' }], error: null }),
    })
    mockFrom.mockImplementation((t: string) => {
      if (t === 'activity_log') {
        return { insert: alInsert }
      }
      return { insert }
    })
    const ids = await duplicateTaskToFields(supabase, { task: baseTask, fieldIds: ['fa', 'fb'], actorId: 'act' })
    expect(ids).toEqual(['n1', 'n2'])
  })

  it('throws when current_person_id rpc errors', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'rpc' } })
    await expect(duplicateTaskToFields(supabase, { task: baseTask, fieldIds: ['f1'], actorId: 'a' })).rejects.toEqual(
      expect.objectContaining({ message: 'rpc' }),
    )
  })

  it('throws when current_person_id is empty', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: null })
    await expect(duplicateTaskToFields(supabase, { task: baseTask, fieldIds: ['f1'], actorId: 'a' })).rejects.toThrow(
      'current_person_id',
    )
  })

  it('throws on insert error', async () => {
    mockRpc.mockResolvedValue({ data: 'me', error: null })
    const insert = vi.fn().mockReturnValue({
      select: () => Promise.resolve({ data: null, error: { message: 'ins' } }),
    })
    mockFrom.mockImplementation((t: string) => (t === 'tasks' ? { insert } : { insert: vi.fn() }))
    await expect(duplicateTaskToFields(supabase, { task: baseTask, fieldIds: ['f1'], actorId: 'a' })).rejects.toEqual(
      expect.objectContaining({ message: 'ins' }),
    )
  })

  it('returns empty ids when PostgREST returns no rows (null data, no error)', async () => {
    mockRpc.mockResolvedValue({ data: 'me', error: null })
    const insert = vi.fn().mockReturnValue({
      select: () => Promise.resolve({ data: null, error: null }),
    })
    mockFrom.mockImplementation((t: string) => (t === 'tasks' ? { insert } : { insert: vi.fn() }))
    const ids = await duplicateTaskToFields(supabase, { task: baseTask, fieldIds: ['f1'], actorId: 'a' })
    expect(ids).toEqual([])
  })
})

describe('duplicateTaskForTomorrow', () => {
  beforeEach(() => {
    mockFrom.mockReset()
    mockRpc.mockReset()
  })

  it('creates a copy with a later due date', async () => {
    mockRpc.mockResolvedValue({ data: 'me', error: null })
    const insert = vi.fn().mockReturnValue({
      select: () => ({
        single: () => Promise.resolve({ data: { id: 'new-1' }, error: null }),
      }),
    })
    const alInsert = vi.fn().mockReturnValue({
      select: () => ({
        single: () => Promise.resolve({ data: { id: 'log1' }, error: null }),
      }),
    })
    mockFrom.mockImplementation((t: string) => (t === 'activity_log' ? { insert: alInsert } : { insert }))

    const id = await duplicateTaskForTomorrow(supabase, { task: baseTask, actorId: 'act' })
    expect(id).toBe('new-1')
    expect(mockRpc).toHaveBeenCalledWith('current_person_id')
  })

  it('throws on insert error from duplicate path', async () => {
    mockRpc.mockResolvedValue({ data: 'me', error: null })
    const insert = vi.fn().mockReturnValue({
      select: () => ({
        single: () => Promise.resolve({ data: null, error: { message: 'dup-ins' } }),
      }),
    })
    mockFrom.mockImplementation((t: string) => (t === 'activity_log' ? { insert: vi.fn() } : { insert }))
    await expect(duplicateTaskForTomorrow(supabase, { task: baseTask, actorId: 'act' })).rejects.toEqual(
      expect.objectContaining({ message: 'dup-ins' }),
    )
  })

  it('throws when single insert returns no row', async () => {
    mockRpc.mockResolvedValue({ data: 'me', error: null })
    const insert = vi.fn().mockReturnValue({
      select: () => ({
        single: () => Promise.resolve({ data: null, error: null }),
      }),
    })
    mockFrom.mockImplementation((t: string) => (t === 'activity_log' ? { insert: vi.fn() } : { insert }))
    await expect(duplicateTaskForTomorrow(supabase, { task: baseTask, actorId: 'act' })).rejects.toThrow('insert')
  })

  it('throws when current_person_id rpc errors (for tomorrow path)', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'whoami' } })
    await expect(duplicateTaskForTomorrow(supabase, { task: baseTask, actorId: 'act' })).rejects.toEqual(
      expect.objectContaining({ message: 'whoami' }),
    )
  })

  it('throws when current_person_id is empty (for tomorrow path)', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: null })
    await expect(duplicateTaskForTomorrow(supabase, { task: baseTask, actorId: 'act' })).rejects.toThrow('current_person_id')
  })
})
