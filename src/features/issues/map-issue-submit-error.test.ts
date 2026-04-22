import { describe, expect, it } from 'vitest'
import { mapIssueSubmitError } from './map-issue-submit-error'

const FB = 'genel hata'

describe('mapIssueSubmitError', () => {
  it('maps network errors', () => {
    expect(mapIssueSubmitError(new Error('Failed to fetch'), FB)).toContain('Ağ hatası')
  })

  it('maps RLS and permission copy', () => {
    expect(mapIssueSubmitError(new Error('row-level security'), FB)).toContain('Erişim engellendi')
  })

  it('maps file size / storage', () => {
    expect(mapIssueSubmitError(new Error('object too large 413'), FB)).toContain('büyük')
  })

  it('passes through short error messages', () => {
    expect(mapIssueSubmitError(new Error('Storage upload timeout'), FB)).toBe('Storage upload timeout')
  })

  it('uses fallback for a very long error string', () => {
    const long = 'x'.repeat(200)
    expect(mapIssueSubmitError(new Error(long), FB)).toBe(FB)
  })

  it('uses fallback for null', () => {
    expect(mapIssueSubmitError(null, FB)).toBe(FB)
  })

  it('stringifies non-Error throws', () => {
    expect(mapIssueSubmitError('short oops', FB)).toBe('short oops')
  })
})
