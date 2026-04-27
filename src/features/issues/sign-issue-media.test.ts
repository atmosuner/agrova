import { describe, expect, it, vi, beforeEach } from 'vitest'
import { signIssueObjectUrl, useSignedUrl } from '@/features/issues/sign-issue-media'

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

describe('signIssueObjectUrl', () => {
  beforeEach(() => {
    createSignedUrl.mockReset()
  })

  it('returns null for empty path', async () => {
    await expect(signIssueObjectUrl(null)).resolves.toBeNull()
    await expect(signIssueObjectUrl('  ')).resolves.toBeNull()
    expect(createSignedUrl).not.toHaveBeenCalled()
  })

  it('returns signed URL when storage succeeds', async () => {
    createSignedUrl.mockResolvedValueOnce({ data: { signedUrl: 'https://signed.example/x' }, error: null })
    await expect(signIssueObjectUrl('uid/issues/abc.jpg')).resolves.toBe('https://signed.example/x')
    expect(createSignedUrl).toHaveBeenCalledWith('uid/issues/abc.jpg', 3600)
  })

  it('returns null when storage errors', async () => {
    createSignedUrl.mockResolvedValueOnce({ data: null, error: { message: 'nope' } })
    await expect(signIssueObjectUrl('path')).resolves.toBeNull()
  })

  it('exports useSignedUrl hook', () => {
    expect(typeof useSignedUrl).toBe('function')
  })
})
