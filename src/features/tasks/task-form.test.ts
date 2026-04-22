import { describe, expect, it } from 'vitest'
import { createTaskStep3Schema } from '@/features/tasks/task-form'

describe('createTaskStep3Schema', () => {
  it('accepts a valid row', () => {
    const r = createTaskStep3Schema.safeParse({
      assigneeId: '00000000-0000-4000-8000-000000000001',
      dueDate: '2030-01-01',
      priority: 'NORMAL',
      notes: '',
    })
    expect(r.success).toBe(true)
  })

  it('rejects long notes', () => {
    const r = createTaskStep3Schema.safeParse({
      assigneeId: '00000000-0000-4000-8000-000000000001',
      dueDate: '2030-01-01',
      priority: 'LOW',
      notes: 'x'.repeat(501),
    })
    expect(r.success).toBe(false)
  })
})
