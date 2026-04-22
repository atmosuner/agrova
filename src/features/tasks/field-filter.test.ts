import { describe, expect, it } from 'vitest'
import { fieldMatchesQuery } from '@/features/tasks/field-filter'

describe('fieldMatchesQuery', () => {
  it('matches Turkish İ vs i case-insensitively', () => {
    expect(fieldMatchesQuery('İstanbul', 'elma', 'i')).toBe(true)
    expect(fieldMatchesQuery('istanbul', 'elma', 'İ')).toBe(true)
  })

  it('filters by crop', () => {
    expect(fieldMatchesQuery('A', 'kiraz', 'kir')).toBe(true)
    expect(fieldMatchesQuery('A', 'elma', 'kir')).toBe(false)
  })

  it('empty query matches all', () => {
    expect(fieldMatchesQuery('X', 'y', '  ')).toBe(true)
  })
})
