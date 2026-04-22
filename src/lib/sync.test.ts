import { describe, expect, it, beforeEach } from 'vitest'
import { resetSyncBackoffForTests } from '@/lib/sync'

describe('sync helpers', () => {
  beforeEach(() => {
    resetSyncBackoffForTests()
  })

  it('exposes reset for tests', () => {
    expect(() => resetSyncBackoffForTests()).not.toThrow()
  })
})

describe('outbox processRow (infrastructure)', () => {
  it('remains to be covered: drainOutbox+processRow need IndexedDB in test (e.g. fake-indexeddb) and Supabase mocks', () => {
    expect(true).toBe(true)
  })
})
