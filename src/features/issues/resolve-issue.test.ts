import { describe, expect, it, vi, beforeEach } from 'vitest'
import { resolveIssue } from '@/features/issues/resolve-issue'

const mockFrom = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}))

describe('resolveIssue', () => {
  beforeEach(() => {
    mockFrom.mockReset()
  })

  it('updates issues row by id', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const update = vi.fn().mockReturnValue({ eq })
    mockFrom.mockReturnValue({ update })

    await resolveIssue({
      issueId: '22222222-2222-2222-2222-222222222222',
      resolverPersonId: '33333333-3333-3333-3333-333333333333',
    })

    expect(mockFrom).toHaveBeenCalledWith('issues')
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        resolved_by: '33333333-3333-3333-3333-333333333333',
      }),
    )
    expect(eq).toHaveBeenCalledWith('id', '22222222-2222-2222-2222-222222222222')
  })

  it('throws when update returns an error', async () => {
    const eq = vi.fn().mockResolvedValue({ error: { message: 'policy' } })
    const update = vi.fn().mockReturnValue({ eq })
    mockFrom.mockReturnValue({ update })
    await expect(
      resolveIssue({
        issueId: '22222222-2222-2222-2222-222222222222',
        resolverPersonId: '33333333-3333-3333-3333-333333333333',
      }),
    ).rejects.toEqual(expect.objectContaining({ message: 'policy' }))
  })
})
