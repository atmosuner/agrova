import { describe, expect, it } from 'vitest'
import { mapPeopleMutationError } from './map-people-mutation-error'

describe('mapPeopleMutationError', () => {
  it('maps unique violation 23505 to Turkish copy', () => {
    expect(mapPeopleMutationError('duplicate', '23505')).toBe('Bu telefon numarası zaten kayıtlı.')
  })

  it('detects unique from message', () => {
    expect(mapPeopleMutationError('Key (phone)=(+90) already exists (unique idx)', undefined)).toBe(
      'Bu telefon numarası zaten kayıtlı.'
    )
  })

  it('returns original message for other errors', () => {
    expect(mapPeopleMutationError('other problem', '23514')).toBe('other problem')
  })
})
