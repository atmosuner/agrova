import { describe, expect, it } from 'vitest'
import { signUpPasswordSchema } from './validation'

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
