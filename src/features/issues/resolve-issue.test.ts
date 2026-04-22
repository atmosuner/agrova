import { describe, expect, it, vi, beforeEach } from 'vitest'
import { resolveIssue } from '@/features/issues/resolve-issue'

const mockFrom = vi.fn()

const fanout = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
vi.mock('@/lib/invoke-web-push-fanout', () => ({
  invokeWebPushFanout: fanout,
}))

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
    const issueEq = vi.fn().mockResolvedValue({ error: null })
    const update = vi.fn().mockReturnValue({ eq: issueEq })
    const issueFrom = { update }
    const alChain: Record<string, unknown> = {}
    alChain.maybeSingle = vi.fn().mockResolvedValue({ data: { id: 'log-1' }, error: null })
    alChain.limit = vi.fn().mockReturnValue(alChain)
    alChain.order = vi.fn().mockReturnValue(alChain)
    alChain.eq = vi.fn().mockReturnValue(alChain)
    const alFrom = { select: vi.fn().mockReturnValue(alChain) }
    mockFrom.mockReturnValueOnce(issueFrom).mockReturnValueOnce(alFrom)

    await resolveIssue({
      issueId: '22222222-2222-2222-2222-222222222222',
      resolverPersonId: '33333333-3333-3333-3333-333333333333',
    })

    expect(mockFrom).toHaveBeenCalledWith('issues')
    expect(mockFrom).toHaveBeenCalledWith('activity_log')
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        resolved_by: '33333333-3333-3333-3333-333333333333',
      }),
    )
    expect(issueEq).toHaveBeenCalledWith('id', '22222222-2222-2222-2222-222222222222')
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

  it('skips web push when activity_log lookup returns no row', async () => {
    const issueEq = vi.fn().mockResolvedValue({ error: null })
    const update = vi.fn().mockReturnValue({ eq: issueEq })
    const alChain: Record<string, unknown> = {}
    alChain.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
    alChain.limit = vi.fn().mockReturnValue(alChain)
    alChain.order = vi.fn().mockReturnValue(alChain)
    alChain.eq = vi.fn().mockReturnValue(alChain)
    const alFrom = { select: vi.fn().mockReturnValue(alChain) }
    mockFrom.mockReturnValueOnce({ update }).mockReturnValueOnce(alFrom)
    fanout.mockClear()
    await resolveIssue({
      issueId: '22222222-2222-2222-2222-222222222222',
      resolverPersonId: '33333333-3333-3333-3333-333333333333',
    })
    expect(fanout).not.toHaveBeenCalled()
  })
})
