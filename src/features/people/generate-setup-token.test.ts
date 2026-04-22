import { describe, expect, it } from 'vitest'
import { generateUrlSafeToken32 } from './generate-setup-token'

describe('generateUrlSafeToken32', () => {
  it('returns 32 chars without +/ padding', () => {
    const t = generateUrlSafeToken32()
    expect(t.length).toBe(32)
    expect(t).not.toMatch(/[+/=]/)
  })
})
