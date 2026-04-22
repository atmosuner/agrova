import { describe, expect, it } from 'vitest'
import { isWebPushActionMutedByPrefs } from '@/lib/notification-prefs'

describe('isWebPushActionMutedByPrefs', () => {
  it('does not treat issue.reported as muted even if listed (KPI)', () => {
    expect(isWebPushActionMutedByPrefs('issue.reported', { muted_event_actions: ['issue.reported'] })).toBe(false)
  })

  it('honors muted_event_actions for other actions', () => {
    expect(isWebPushActionMutedByPrefs('task.started', { muted_event_actions: ['task.started'] })).toBe(true)
    expect(isWebPushActionMutedByPrefs('task.done', { muted_event_actions: ['task.started'] })).toBe(false)
  })
})
