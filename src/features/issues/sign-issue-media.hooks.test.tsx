// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSignedUrl } from '@/features/issues/sign-issue-media'

const createSignedUrl = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    storage: {
      from: () => ({
        createSignedUrl: (...args: unknown[]) => createSignedUrl(...args),
      }),
    },
  },
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

describe('useSignedUrl (jsdom hook)', () => {
  let qc: QueryClient
  beforeEach(() => {
    qc = makeQueryClient()
    createSignedUrl.mockReset()
  })
  afterEach(() => {
    qc.clear()
  })

  it('returns signed URL for a valid storage path', async () => {
    createSignedUrl.mockResolvedValueOnce({ data: { signedUrl: 'https://signed.example/img.jpg' }, error: null })
    const { result } = renderHook(() => useSignedUrl('uid/issues/img.jpg'), { wrapper: wrapper(qc) })
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(result.current.data).toBe('https://signed.example/img.jpg')
  })

  it('does not fetch when path is null', () => {
    renderHook(() => useSignedUrl(null), { wrapper: wrapper(qc) })
    expect(createSignedUrl).not.toHaveBeenCalled()
  })
})
