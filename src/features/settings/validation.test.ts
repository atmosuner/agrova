import { describe, expect, it } from 'vitest'
import { operationSettingsFormSchema } from './validation'

describe('operationSettingsFormSchema', () => {
  it('accepts non-empty name and city', () => {
    const r = operationSettingsFormSchema.safeParse({
      operationName: 'Dönüşüm Bahçesi',
      weatherCity: 'Antalya',
    })
    expect(r.success).toBe(true)
  })

  it('rejects empty city', () => {
    const r = operationSettingsFormSchema.safeParse({
      operationName: 'X',
      weatherCity: '  ',
    })
    expect(r.success).toBe(false)
  })
})
