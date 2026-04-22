import { describe, expect, it } from 'vitest'
import { shouldDeliverPushToOwner } from '@/lib/notification-prefs'

describe('shouldDeliverPushToOwner', () => {
  it('delivers issue.reported to owner even if they are the reporter', () => {
    expect(
      shouldDeliverPushToOwner({
        activityAction: 'issue.reported',
        actorPersonId: 'a',
        ownerPersonId: 'a',
        ownerNotificationPrefs: {},
      }),
    ).toBe(true)
  })

  it('skips self-notification for non-issue actions', () => {
    expect(
      shouldDeliverPushToOwner({
        activityAction: 'task.done',
        actorPersonId: 'a',
        ownerPersonId: 'a',
        ownerNotificationPrefs: {},
      }),
    ).toBe(false)
  })

  it('respects muted_event_actions', () => {
    expect(
      shouldDeliverPushToOwner({
        activityAction: 'task.started',
        actorPersonId: 'worker',
        ownerPersonId: 'owner',
        ownerNotificationPrefs: { muted_event_actions: ['task.started'] },
      }),
    ).toBe(false)
  })

  it('does not allow muting issue.reported via prefs (KPI; filtering is in UI too)', () => {
    expect(
      shouldDeliverPushToOwner({
        activityAction: 'issue.reported',
        actorPersonId: 'w',
        ownerPersonId: 'o',
        ownerNotificationPrefs: { muted_event_actions: ['issue.reported'] },
      }),
    ).toBe(true)
  })
})
