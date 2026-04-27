import { describe, expect, it } from 'vitest'
import { CATEGORY_LABEL } from '@/features/issues/issue-labels'
import { ISSUE_CATEGORY_ORDER } from '@/features/issues/categories'

describe('CATEGORY_LABEL', () => {
  it('has a label for every category in the order list', () => {
    for (const cat of ISSUE_CATEGORY_ORDER) {
      expect(CATEGORY_LABEL[cat]).toBeDefined()
      expect(CATEGORY_LABEL[cat].id).toBeTruthy()
    }
  })
})
