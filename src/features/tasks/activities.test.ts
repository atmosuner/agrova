import { describe, expect, it } from 'vitest'
import { ACTIVITY_IDS, activityDbValue, activityIdFromDbValue } from '@/features/tasks/activities'

describe('activityIdFromDbValue', () => {
  it('round-trips with activityDbValue', () => {
    for (const id of ACTIVITY_IDS) {
      expect(activityIdFromDbValue(activityDbValue(id))).toBe(id)
    }
  })

  it('returns null for unknown', () => {
    expect(activityIdFromDbValue('Nope')).toBeNull()
  })
})
