import { describe, expect, it } from 'vitest'
import {
  normalizeTrMobileToE164,
  teamPersonAddSchema,
  teamPersonEditFormSchema,
  teamPersonFormSchema,
} from './validation'

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

describe('teamPersonEditFormSchema', () => {
  it('requires valid sign-in e-mail with crew row', () => {
    const bad = teamPersonEditFormSchema.safeParse({
      fullName: 'Ali Yılmaz',
      phone: '+905551234567',
      role: 'WORKER',
      loginEmail: 'not-an-email',
    })
    expect(bad.success).toBe(false)
    const ok = teamPersonEditFormSchema.safeParse({
      fullName: 'Ali Yılmaz',
      phone: '+905551234567',
      role: 'WORKER',
      loginEmail: 'w00000000@device.agrova.app',
    })
    expect(ok.success).toBe(true)
  })
})

describe('teamPersonAddSchema', () => {
  it('strips sign-in e-mail if present (add form also carries `loginEmail`)', () => {
    const r = teamPersonAddSchema.safeParse({
      fullName: 'Ali',
      phone: '+905551234567',
      role: 'WORKER',
      password: 'abcdefgh',
      passwordConfirm: 'abcdefgh',
      loginEmail: 'who@device.agrova.app',
    })
    expect(r.success).toBe(true)
  })

  it('requires matching passwords', () => {
    const bad = teamPersonAddSchema.safeParse({
      fullName: 'Ali',
      phone: '+905551234567',
      role: 'WORKER',
      password: 'abcdefgh',
      passwordConfirm: 'abcdefgi',
    })
    expect(bad.success).toBe(false)
    const ok = teamPersonAddSchema.safeParse({
      fullName: 'Ali',
      phone: '+905551234567',
      role: 'WORKER',
      password: 'abcdefgh',
      passwordConfirm: 'abcdefgh',
    })
    expect(ok.success).toBe(true)
  })
})
