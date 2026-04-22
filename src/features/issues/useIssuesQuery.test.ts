import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fetchIssuesList, issuesListQueryKey, subscribeIssuesFeed } from '@/features/issues/useIssuesQuery'

const h = vi.hoisted(() => {
  const orderMock = vi.fn()
  const channelOn = vi.fn()
  const subscribe = vi.fn()
  const removeChannel = vi.fn()
  const supabase = {
    from: () => ({
      select: () => ({
        order: (...args: unknown[]) => orderMock(...args),
      }),
    }),
    channel: () => ({
      on: (...args: unknown[]) => {
        channelOn(...args)
        return { subscribe }
      },
    }),
    removeChannel: (...args: unknown[]) => removeChannel(...args),
  }
  return { orderMock, channelOn, subscribe, removeChannel, supabase }
})

vi.mock('@/lib/supabase', () => ({
  supabase: h.supabase,
}))

describe('fetchIssuesList', () => {
  beforeEach(() => {
    h.orderMock.mockReset()
  })

  it('orders by created_at descending', async () => {
    h.orderMock.mockResolvedValueOnce({
      data: [
        {
          id: '1',
          category: 'PEST',
          created_at: '2026-01-01T00:00:00Z',
          photo_url: null,
          voice_note_url: null,
          resolved_at: null,
          resolved_by: null,
          task_id: null,
          field_id: null,
          reporter: { full_name: 'A' },
          resolver: null,
          field: null,
        },
      ],
      error: null,
    })
    const rows = await fetchIssuesList()
    expect(h.orderMock).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(rows).toHaveLength(1)
    expect(rows[0]?.category).toBe('PEST')
  })

  it('throws when PostgREST returns an error', async () => {
    h.orderMock.mockResolvedValueOnce({ data: null, error: { message: 'fail' } })
    await expect(fetchIssuesList()).rejects.toEqual(expect.objectContaining({ message: 'fail' }))
  })
})

describe('subscribeIssuesFeed', () => {
  beforeEach(() => {
    h.channelOn.mockReset()
    h.subscribe.mockReset()
    h.removeChannel.mockReset()
  })

  it('invalidates issues query on postgres payload and removes channel on teardown', () => {
    const qc = new QueryClient()
    const inv = vi.spyOn(qc, 'invalidateQueries').mockImplementation(() => Promise.resolve())
    const unsub = subscribeIssuesFeed(qc)
    expect(h.channelOn).toHaveBeenCalled()
    const call = h.channelOn.mock.calls.find((c) => c[0] === 'postgres_changes')
    expect(call).toBeDefined()
    const payloadCb = call![2] as () => void
    payloadCb()
    expect(inv).toHaveBeenCalledWith({ queryKey: issuesListQueryKey })
    unsub()
    expect(h.removeChannel).toHaveBeenCalled()
  })
})

describe('issuesListQueryKey', () => {
  it('is stable', () => {
    expect(issuesListQueryKey).toEqual(['owner', 'issues'])
  })
})
