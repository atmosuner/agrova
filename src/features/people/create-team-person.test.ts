import { describe, expect, it } from 'vitest'
import { mapCreateTeamPersonError } from '@/features/people/create-team-person'

describe('mapCreateTeamPersonError', () => {
  it('maps 409 to duplicate phone copy', () => {
    expect(mapCreateTeamPersonError(409, { error: 'phone_in_use' })).toContain('telefon')
  })

  it('maps 403', () => {
    expect(mapCreateTeamPersonError(403, { error: 'forbidden' })).toContain('sahibi')
  })
})
