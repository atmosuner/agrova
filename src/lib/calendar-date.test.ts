import { describe, expect, it } from 'vitest'
import { addCalendarDaysToIsoDate } from '@/lib/calendar-date'

describe('addCalendarDaysToIsoDate', () => {
  it('adds days across month boundary', () => {
    expect(addCalendarDaysToIsoDate('2026-01-31', 1)).toBe('2026-02-01')
  })
})
