import { describe, expect, it } from 'vitest'
import { defaultTasksSearch, parseTasksSearch, tasksSearchDueOn } from '@/features/tasks/tasks-search'

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

  it('rejects invalid status and due date formats', () => {
    const d = defaultTasksSearch()
    expect(parseTasksSearch({ status: 'GARBAGE' }).status).toBe(d.status)
    expect(parseTasksSearch({ dueFrom: 'not-a-date' }).dueFrom).toBe(d.dueFrom)
    expect(parseTasksSearch({ page: 'abc' }).page).toBe(d.page)
  })

  it('parses assignee, activity, task, due range, and table view', () => {
    const s = parseTasksSearch({
      assignee: 'p1',
      activity: 'il',
      task: 'tid',
      dueFrom: '2026-01-01',
      dueTo: '2026-12-31',
      view: 'table',
    })
    expect(s.assignee).toBe('p1')
    expect(s.activity).toBe('il')
    expect(s.task).toBe('tid')
    expect(s.dueFrom).toBe('2026-01-01')
    expect(s.dueTo).toBe('2026-12-31')
    expect(s.view).toBe('table')
  })
})

describe('tasksSearchDueOn', () => {
  it('sets same due from and to', () => {
    const s = tasksSearchDueOn('2026-04-22')
    expect(s.dueFrom).toBe('2026-04-22')
    expect(s.dueTo).toBe('2026-04-22')
  })
})
