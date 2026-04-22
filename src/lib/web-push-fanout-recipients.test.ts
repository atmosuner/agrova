import { describe, expect, it } from 'vitest'
import { resolveWebPushRecipientIds, parsePayloadUuid } from '../../supabase/functions/_shared/web-push-fanout-recipients.ts'

const O = (id: string) => ({ id })
const owner1 = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const owner2 = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const worker = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
const assignee = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'

describe('resolveWebPushRecipientIds', () => {
  it('task.created: notifies assignee when assignee is not the actor (owner created task)', () => {
    const ids = resolveWebPushRecipientIds(
      { actor_id: owner1, action: 'task.created', subject_type: 'task', subject_id: 't1', payload: null },
      { assignee_id: assignee },
      [O(owner1), O(owner2)],
    )
    expect(ids).toEqual([assignee])
  })

  it('task.created: no one when self-assigned and actor is assignee', () => {
    expect(
      resolveWebPushRecipientIds(
        { actor_id: assignee, action: 'task.created', subject_type: 'task', subject_id: 't1', payload: null },
        { assignee_id: assignee },
        [O(owner1)],
      ),
    ).toEqual([])
  })

  it('task.duplicated: same as task.created (assignee)', () => {
    const ids = resolveWebPushRecipientIds(
      { actor_id: owner1, action: 'task.duplicated', subject_type: 'task', subject_id: 't1', payload: {} },
      { assignee_id: worker },
      [O(owner1)],
    )
    expect(ids).toEqual([worker])
  })

  it('task.started: notifies all owners except the actor (worker started)', () => {
    const ids = resolveWebPushRecipientIds(
      { actor_id: worker, action: 'task.started', subject_type: 'task', subject_id: 't1', payload: null },
      { assignee_id: worker },
      [O(owner1), O(owner2)],
    )
    expect(ids).toEqual(expect.arrayContaining([owner1, owner2]))
    expect(ids).toHaveLength(2)
  })

  it('task.started: excludes owner-actor; other owners still get notified', () => {
    const ids = resolveWebPushRecipientIds(
      { actor_id: owner1, action: 'task.started', subject_type: 'task', subject_id: 't1', payload: null },
      { assignee_id: owner1 },
      [O(owner1), O(owner2)],
    )
    expect(ids).toEqual([owner2])
  })

  it('task.reassigned: previous + new + owners, excluding actor', () => {
    const ids = resolveWebPushRecipientIds(
      {
        actor_id: owner1,
        action: 'task.reassigned',
        subject_type: 'task',
        subject_id: 't1',
        payload: { previous_assignee_id: worker, new_assignee_id: assignee },
      },
      null,
      [O(owner1), O(owner2)],
    )
    expect(ids.sort()).toEqual([assignee, owner2, worker].sort())
  })

  it('issue.reported: all owners except reporter', () => {
    const ids = resolveWebPushRecipientIds(
      { actor_id: worker, action: 'issue.reported', subject_type: 'issue', subject_id: 'i1', payload: null },
      null,
      [O(owner1), O(owner2)],
    )
    expect(ids.sort()).toEqual([owner1, owner2].sort())
  })
})

describe('parsePayloadUuid', () => {
  it('reads reassignment keys', () => {
    const p = { previous_assignee_id: worker, new_assignee_id: assignee }
    expect(parsePayloadUuid(p, 'previous_assignee_id')).toBe(worker)
    expect(parsePayloadUuid(p, 'new_assignee_id')).toBe(assignee)
  })
})
