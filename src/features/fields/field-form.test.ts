import { describe, expect, it } from 'vitest'
import { fieldFormSchema } from './field-form'

describe('fieldFormSchema', () => {
  it('rejects empty name', () => {
    const r = fieldFormSchema.safeParse({
      name: '  ',
      crop: '',
      variety: '',
      plantCount: '',
      plantedYear: '',
      notes: '',
      address: '',
    })
    expect(r.success).toBe(false)
  })

  it('accepts minimal valid row', () => {
    const r = fieldFormSchema.safeParse({
      name: 'Tarla 1',
      crop: '',
      variety: '',
      plantCount: '',
      plantedYear: '',
      notes: '',
      address: '',
    })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.name).toBe('Tarla 1')
    }
  })
})
