import { describe, expect, it } from 'vitest'
import { safePostAuthPath } from './redirect'

describe('safePostAuthPath', () => {
  it('defaults to /today', () => {
    expect(safePostAuthPath(undefined)).toBe('/today')
  })

  it('allows internal paths', () => {
    expect(safePostAuthPath('/people')).toBe('/people')
  })

  it('rejects protocol-relative URLs', () => {
    expect(safePostAuthPath('//evil.com')).toBe('/today')
  })
})
