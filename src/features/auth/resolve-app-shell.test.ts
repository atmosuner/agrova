import { describe, expect, it } from 'vitest'
import { shellFromPersonRole } from './resolve-app-shell'

describe('shellFromPersonRole', () => {
  it('routes OWNER to owner shell', () => {
    expect(shellFromPersonRole('OWNER')).toBe('owner')
  })

  it('routes crew to worker shell', () => {
    expect(shellFromPersonRole('WORKER')).toBe('worker')
    expect(shellFromPersonRole('FOREMAN')).toBe('worker')
    expect(shellFromPersonRole('AGRONOMIST')).toBe('worker')
  })

  it('treats null/undefined as owner shell (defensive default)', () => {
    expect(shellFromPersonRole(null)).toBe('owner')
    expect(shellFromPersonRole(undefined)).toBe('owner')
  })
})
