import { describe, expect, it } from 'vitest'
import { newPasswordPairValuesSchema, signUpPasswordSchema } from './validation'

describe('signUp password rules', () => {
  it('accepts 8+ chars with a digit', () => {
    expect(signUpPasswordSchema.safeParse('abcdefg1').success).toBe(true)
  })

  it('rejects short password', () => {
    expect(signUpPasswordSchema.safeParse('short1').success).toBe(false)
  })

  it('rejects password without digit', () => {
    expect(signUpPasswordSchema.safeParse('abcdefgh').success).toBe(false)
  })
})

describe('newPasswordPairValuesSchema', () => {
  it('rejects mismatch', () => {
    const r = newPasswordPairValuesSchema.safeParse({
      newPassword: 'abcdefgh',
      newPasswordConfirm: 'abcdefgi',
    })
    expect(r.success).toBe(false)
  })

  it('accepts match', () => {
    const r = newPasswordPairValuesSchema.safeParse({
      newPassword: 'abcdefgh',
      newPasswordConfirm: 'abcdefgh',
    })
    expect(r.success).toBe(true)
  })
})
