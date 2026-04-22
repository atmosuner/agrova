import { describe, expect, it } from 'vitest'
import { defaultTasksSearch, parseTasksSearch } from '@/features/tasks/tasks-search'

describe('parseTasksSearch', () => {
  it('applies defaults', () => {
    expect(parseTasksSearch({})).toEqual(defaultTasksSearch())
  })

  it('reads filters', () => {
    const s = parseTasksSearch({
      status: 'TODO',
      field: 'a',
      page: '2',
      view: 'kanban',
    })
    expect(s.status).toBe('TODO')
    expect(s.field).toBe('a')
    expect(s.page).toBe(2)
    expect(s.view).toBe('kanban')
  })
})
