import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { invokeWebPushFanout } from '@/lib/invoke-web-push-fanout'

const mockInvoke = vi.fn()

describe('invokeWebPushFanout', () => {
  const supabase = { functions: { invoke: mockInvoke } } as unknown as Parameters<typeof invokeWebPushFanout>[0]
  let warnSpy: ReturnType<typeof vi.spyOn> | null = null

  beforeEach(() => {
    mockInvoke.mockReset()
  })

  afterEach(() => {
    warnSpy?.mockRestore()
    warnSpy = null
  })

  it('invokes web-push-fanout with activity log id', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: null })
    await invokeWebPushFanout(supabase, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
    expect(mockInvoke).toHaveBeenCalledWith('web-push-fanout', {
      body: { activityLogId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' },
    })
  })

  it('swallows function errors and logs a warning', async () => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mockInvoke.mockResolvedValue({ data: null, error: { message: 'unauthorized' } })
    await expect(invokeWebPushFanout(supabase, 'b')).resolves.toBeUndefined()
    expect(warnSpy).toHaveBeenCalled()
  })
})
