import { afterEach, describe, expect, it, vi, beforeEach } from 'vitest'
import { submitIssueDraft } from '@/features/issues/submit-issue'

const mockBlobsAdd = vi.fn()
const mockEnqueue = vi.fn()
const mockDrain = vi.fn()

vi.mock('@/lib/db', () => ({
  db: {
    blobs: {
      add: (...args: unknown[]) => mockBlobsAdd(...args),
    },
  },
}))

vi.mock('@/lib/sync', () => ({
  enqueueOutbox: (...args: unknown[]) => mockEnqueue(...args),
  drainOutbox: () => mockDrain(),
}))

describe('submitIssueDraft', () => {
  beforeEach(() => {
    mockBlobsAdd.mockClear()
    mockEnqueue.mockClear()
    mockDrain.mockClear()
    mockEnqueue.mockResolvedValue('outbox-id')
    vi.stubGlobal('crypto', { randomUUID: () => 'cccccccc-cccc-cccc-cccc-cccccccccccc' })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('enqueues issue_row before issue_photo with ordered timestamps', async () => {
    await submitIssueDraft({
      category: 'PEST',
      photoJpeg: new Blob(['x'], { type: 'image/jpeg' }),
      reporterId: '11111111-1111-1111-1111-111111111111',
    })
    expect(mockBlobsAdd).toHaveBeenCalledOnce()
    expect(mockEnqueue).toHaveBeenCalledTimes(2)
    expect(mockEnqueue.mock.calls[0]?.[0]?.kind).toBe('issue_row')
    expect(mockEnqueue.mock.calls[1]?.[0]?.kind).toBe('issue_photo')
    const t0 = mockEnqueue.mock.calls[0]?.[0]?.enqueued_at as number
    const t1 = mockEnqueue.mock.calls[1]?.[0]?.enqueued_at as number
    expect(t1).toBeGreaterThan(t0)
    expect(mockDrain).toHaveBeenCalledOnce()
  })

  it('includes task, field, and gps keys in row payload when provided', async () => {
    await submitIssueDraft({
      category: 'WEATHER',
      photoJpeg: new Blob(['x'], { type: 'image/jpeg' }),
      reporterId: '11111111-1111-1111-1111-111111111111',
      taskId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      fieldId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      gpsLat: 41.0082,
      gpsLng: 28.9784,
    })
    const payload = mockEnqueue.mock.calls[0]?.[0]?.payload as Record<string, unknown>
    expect(payload['taskId']).toBe('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
    expect(payload['fieldId']).toBe('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')
    expect(payload['gpsLat']).toBe(41.0082)
    expect(payload['gpsLng']).toBe(28.9784)
  })

  it('enqueues issue_voice after photo when a voice blob is attached', async () => {
    await submitIssueDraft({
      category: 'SUPPLY',
      photoJpeg: new Blob(['x'], { type: 'image/jpeg' }),
      reporterId: '11111111-1111-1111-1111-111111111111',
      voiceBlob: new Blob(['a'], { type: 'audio/webm' }),
    })
    expect(mockEnqueue).toHaveBeenCalledTimes(3)
    expect(mockEnqueue.mock.calls[2]?.[0]?.kind).toBe('issue_voice')
    const t2 = mockEnqueue.mock.calls[2]?.[0]?.enqueued_at as number
    const t1 = mockEnqueue.mock.calls[1]?.[0]?.enqueued_at as number
    expect(t2).toBeGreaterThan(t1)
  })

  it('omits task/field/gps from row payload when undefined or NaN', async () => {
    await submitIssueDraft({
      category: 'EQUIPMENT',
      photoJpeg: new Blob(['x'], { type: 'image/jpeg' }),
      reporterId: '11111111-1111-1111-1111-111111111111',
      gpsLat: Number.NaN,
      gpsLng: Number.NaN,
    })
    const payload = mockEnqueue.mock.calls[0]?.[0]?.payload as Record<string, unknown>
    expect(payload['taskId']).toBeUndefined()
    expect(payload['fieldId']).toBeUndefined()
    expect(payload['gpsLat']).toBeUndefined()
    expect(payload['gpsLng']).toBeUndefined()
  })

  it('uses non-crypto id fallbacks when randomUUID is unavailable', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(globalThis as any).crypto = undefined
    await submitIssueDraft({
      category: 'PEST',
      photoJpeg: new Blob(['x'], { type: 'image/jpeg' }),
      reporterId: '11111111-1111-1111-1111-111111111111',
      voiceBlob: new Blob(['v'], { type: 'audio/webm' }),
    })
    const rowPayload = mockEnqueue.mock.calls[0]?.[0]?.payload as { issueId: string }
    const photoPayload = mockEnqueue.mock.calls[1]?.[0]?.payload as { blobId: string }
    expect(rowPayload.issueId).toMatch(/^issue-/)
    expect(photoPayload.blobId).toMatch(/^blob-/)
    const voiceCall = mockEnqueue.mock.calls[2]?.[0] as { kind: string; payload: { blobId: string } }
    expect(voiceCall.kind).toBe('issue_voice')
    expect(voiceCall.payload.blobId).toMatch(/^voice-/)
  })
})
