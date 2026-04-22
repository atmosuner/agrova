import { describe, expect, it } from 'vitest'
import { parseEquipmentSearch } from './validation'

describe('parseEquipmentSearch', () => {
  it('defaults to VEHICLE', () => {
    expect(parseEquipmentSearch({}).cat).toBe('VEHICLE')
  })

  it('accepts valid category', () => {
    expect(parseEquipmentSearch({ cat: 'CHEMICAL' }).cat).toBe('CHEMICAL')
  })

  it('falls back on invalid', () => {
    expect(parseEquipmentSearch({ cat: 'nope' }).cat).toBe('VEHICLE')
  })
})
