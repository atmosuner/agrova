import { describe, expect, it, vi, beforeEach } from 'vitest'
import { logActivity } from '@/features/tasks/log-activity'

const mockFrom = vi.fn()
const mockInvoke = vi.fn()

vi.mock('@/lib/invoke-web-push-fanout', () => ({
  invokeWebPushFanout: (...args: unknown[]) => mockInvoke(...args),
}))

const supabase = { from: (...args: unknown[]) => mockFrom(...args) } as never

describe('logActivity', () => {
  beforeEach(() => {
    mockFrom.mockReset()
    mockInvoke.mockReset()
  })

  it('inserts and triggers fanout when id is returned', async () => {
    const single = vi.fn().mockResolvedValue({ data: { id: 'act-1' }, error: null })
    const select = vi.fn().mockReturnValue({ single })
    const insert = vi.fn().mockReturnValue({ select })
    mockFrom.mockReturnValue({ insert })

    await logActivity(supabase, {
      actorId: 'a',
      action: 'task.done',
      subjectType: 'task',
      subjectId: 's',
    })

    expect(mockFrom).toHaveBeenCalledWith('activity_log')
    expect(mockInvoke).toHaveBeenCalledWith(supabase, 'act-1')
  })

  it('throws on insert error', async () => {
    const single = vi.fn().mockResolvedValue({ data: null, error: { message: 'rls' } })
    const select = vi.fn().mockReturnValue({ single })
    const insert = vi.fn().mockReturnValue({ select })
    mockFrom.mockReturnValue({ insert })
    await expect(
      logActivity(supabase, { actorId: 'a', action: 'task.started', subjectType: 'task', subjectId: 's' }),
    ).rejects.toEqual(expect.objectContaining({ message: 'rls' }))
  })
})
