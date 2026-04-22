// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useIssuesListQuery, useIssuesRealtime } from '@/features/issues/useIssuesQuery'

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

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
}

function wrapper(qc: QueryClient) {
  return function W({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
}

describe('useIssuesListQuery (jsdom hook)', () => {
  let qc: QueryClient
  beforeEach(() => {
    qc = makeQueryClient()
    h.orderMock.mockReset()
    h.orderMock.mockResolvedValue({
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
  })
  afterEach(() => {
    qc.clear()
  })

  it('resolves to issue rows from fetchIssuesList', async () => {
    const { result } = renderHook(() => useIssuesListQuery(), { wrapper: wrapper(qc) })
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data?.[0]?.id).toBe('1')
  })
})

describe('useIssuesRealtime (jsdom hook)', () => {
  beforeEach(() => {
    h.channelOn.mockReset()
    h.subscribe.mockReset()
    h.removeChannel.mockReset()
  })

  it('subscribes to postgres_changes and removes channel on unmount', () => {
    const qc = makeQueryClient()
    const { unmount } = renderHook(() => useIssuesRealtime(), { wrapper: wrapper(qc) })
    expect(h.channelOn).toHaveBeenCalled()
    unmount()
    expect(h.removeChannel).toHaveBeenCalled()
  })
})
