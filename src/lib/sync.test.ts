import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockFrom = vi.hoisted(() => vi.fn())

vi.mock('@/lib/invoke-web-push-fanout', () => ({
  invokeWebPushFanout: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => mockFrom(table),
    auth: {
      getUser: () => Promise.resolve({ data: { user: { id: '00000000-0000-4000-8000-000000000099' } }, error: null }),
    },
  },
}))

vi.mock('@/features/tasks/reassign-task', () => ({
  reassignTask: vi.fn().mockResolvedValue(undefined),
}))

import { db } from '@/lib/db'
import { drainOutbox, enqueueOutbox, resetSyncBackoffForTests } from '@/lib/sync'
import type { Json } from '@/types/db'

const T1 = '11111111-1111-1111-1111-111111111111'

function chainTasks(maybeResult: { data: unknown; error: unknown }) {
  const maybeSingle = vi.fn().mockResolvedValue(maybeResult)
  const eq = vi.fn().mockReturnValue({ maybeSingle })
  const select = vi.fn().mockReturnValue({ eq })
  return { select } as { select: ReturnType<typeof vi.fn> }
}

describe('sync helpers', () => {
  beforeEach(() => {
    resetSyncBackoffForTests()
  })

  it('exposes reset for tests', () => {
    expect(() => resetSyncBackoffForTests()).not.toThrow()
  })
})

describe('outbox enqueue + drain (IndexedDB via fake-indexeddb)', () => {
  beforeEach(async () => {
    resetSyncBackoffForTests()
    await db.outbox.clear()
    mockFrom.mockReset()
  })

  it('drainOutbox removes a no-op task_status row (empty taskId) without calling the network', async () => {
    await enqueueOutbox({
      kind: 'task_status',
      payload: {
        taskId: '',
        fromStatus: 'TODO',
        toStatus: 'IN_PROGRESS',
      } as unknown as Json,
    })
    expect(await db.outbox.count()).toBe(1)
    await drainOutbox()
    expect(await db.outbox.count()).toBe(0)
    expect(mockFrom).not.toHaveBeenCalled()
  })
})

describe('outbox processRow: task_status (mocked supabase)', () => {
  beforeEach(async () => {
    resetSyncBackoffForTests()
    await db.outbox.clear()
    mockFrom.mockReset()
  })

  it('drops outbox row when server status no longer matches fromStatus (last-write-wins / mismatch)', async () => {
    mockFrom.mockImplementation((t: string) => {
      if (t === 'tasks') {
        return chainTasks({
          data: { id: T1, status: 'IN_PROGRESS', assignee_id: 'a' },
          error: null,
        })
      }
      return { select: () => ({ eq: () => ({ maybeSingle: vi.fn() }) }) }
    })
    await enqueueOutbox({
      kind: 'task_status',
      payload: {
        taskId: T1,
        fromStatus: 'TODO',
        toStatus: 'DONE',
      } as unknown as Json,
    })
    expect(await db.outbox.count()).toBe(1)
    await drainOutbox()
    expect(await db.outbox.count()).toBe(0)
  })

  it('records last_error and increments attempts when select fails', async () => {
    mockFrom.mockImplementation((t: string) => {
      if (t === 'tasks') {
        return chainTasks({ data: null, error: { message: 'rls' } })
      }
      return { select: () => ({ eq: () => ({ maybeSingle: vi.fn() }) }) }
    })
    await enqueueOutbox({
      kind: 'task_status',
      payload: {
        taskId: T1,
        fromStatus: 'TODO',
        toStatus: 'IN_PROGRESS',
      } as unknown as Json,
    })
    await drainOutbox()
    const rows = await db.outbox.toArray()
    expect(rows).toHaveLength(1)
    expect(rows[0]?.attempts).toBe(1)
    expect(rows[0]?.last_error).toBeTruthy()
  })
})
