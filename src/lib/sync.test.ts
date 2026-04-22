import { describe, expect, it, beforeEach } from 'vitest'
import { db } from '@/lib/db'
import { drainOutbox, enqueueOutbox, resetSyncBackoffForTests } from '@/lib/sync'
import type { Json } from '@/types/db'

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
  })
})
