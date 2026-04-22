import { describe, expect, it } from 'vitest'
import { normalizeTrMobileToE164, teamPersonFormSchema } from './validation'

describe('normalizeTrMobileToE164', () => {
  it('keeps +905…', () => {
    expect(normalizeTrMobileToE164('+905551234567')).toBe('+905551234567')
  })

  it('adds +90 to 5xx… 10 digits', () => {
    expect(normalizeTrMobileToE164('5551234567')).toBe('+905551234567')
  })

  it('strips leading 0 from 11-digit national', () => {
    expect(normalizeTrMobileToE164('05551234567')).toBe('+905551234567')
  })

  it('returns whitespace-stripped raw when digits do not match TR mobile patterns', () => {
    expect(normalizeTrMobileToE164(' 12 34 ')).toBe('1234')
  })
})

describe('teamPersonFormSchema', () => {
  it('passes for TR mobile and crew role', () => {
    const r = teamPersonFormSchema.safeParse({
      fullName: 'Ali Yılmaz',
      phone: '+905551234567',
      role: 'WORKER',
    })
    expect(r.success).toBe(true)
  })
})
