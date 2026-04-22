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

describe('outbox processRow conflict path', () => {
  it('placeholder — full drain tests need Dexie in-memory + mocked supabase', () => {
    expect(true).toBe(true)
  })
})
