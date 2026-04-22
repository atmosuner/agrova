import { describe, expect, it } from 'vitest'
import { ISSUE_CATEGORY_ORDER } from '@/features/issues/categories'

describe('ISSUE_CATEGORY_ORDER', () => {
  it('lists seven worker categories', () => {
    expect(ISSUE_CATEGORY_ORDER).toHaveLength(7)
  })
})
