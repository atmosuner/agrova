/* eslint-disable lingui/no-unlocalized-strings -- JSON keys and action slugs */
import type { Json } from '@/types/db'

/** Actions the owner may mute for Web Push (never includes `issue.reported`). */
export const MUTEABLE_OWNER_PUSH_ACTIONS = [
  'task.created',
  'task.reassigned',
  'task.started',
  'task.done',
  'task.blocked',
  'task.duplicated',
  'issue.resolved',
] as const

export type MuteableOwnerPushAction = (typeof MUTEABLE_OWNER_PUSH_ACTIONS)[number]

export function readMutedEventActions(prefs: Json | null | undefined): string[] {
  if (!prefs || typeof prefs !== 'object' || Array.isArray(prefs)) {
    return []
  }
  const a = (prefs as { muted_event_actions?: unknown }).muted_event_actions
  return Array.isArray(a) ? a.filter((x): x is string => typeof x === 'string') : []
}

/**
 * Mirrors `supabase/functions/web-push-fanout` delivery rules for one owner row
 * (used in unit tests; keep in sync with the edge function).
 */
export function shouldDeliverPushToOwner(input: {
  activityAction: string
  actorPersonId: string
  ownerPersonId: string
  ownerNotificationPrefs: Json | null | undefined
}): boolean {
  const { activityAction, actorPersonId, ownerPersonId, ownerNotificationPrefs } = input
  const isOwnerIssueKpi = activityAction === 'issue.reported'
  if (ownerPersonId === actorPersonId && !isOwnerIssueKpi) {
    return false
  }
  if (!isOwnerIssueKpi && readMutedEventActions(ownerNotificationPrefs).includes(activityAction)) {
    return false
  }
  if (!activityAction.startsWith('issue.') && ownerPersonId === actorPersonId) {
    return false
  }
  return true
}
