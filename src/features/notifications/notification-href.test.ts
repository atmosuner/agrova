import { describe, expect, it } from 'vitest'
import { inboxRowToIssueHighlight, inboxRowToTaskLink } from '@/features/notifications/notification-href'
import type { InboxRow } from '@/features/notifications/use-notifications-inbox'

function row(partial: Partial<InboxRow> & { id: string }): InboxRow {
  return {
    id: partial.id,
    read_at: partial.read_at ?? null,
    created_at: partial.created_at ?? new Date().toISOString(),
    activity_log: partial.activity_log ?? null,
  }
}

describe('inboxRowToTaskLink / inboxRowToIssueHighlight', () => {
  it('builds task deep link with task id', () => {
    const r = row({
      id: '1',
      activity_log: {
        id: 'a1',
        action: 'task.done',
        subject_type: 'task',
        subject_id: 't-1',
        created_at: new Date().toISOString(),
        actor: { full_name: 'X' },
      },
    })
    const l = inboxRowToTaskLink(r)
    expect(l?.to).toBe('/tasks')
    expect(l?.search.task).toBe('t-1')
  })

  it('returns issue id for issues', () => {
    const r = row({
      id: '1',
      activity_log: {
        id: 'a1',
        action: 'issue.reported',
        subject_type: 'issue',
        subject_id: 'i-9',
        created_at: new Date().toISOString(),
        actor: { full_name: 'Y' },
      },
    })
    expect(inboxRowToIssueHighlight(r)).toBe('i-9')
  })
})
