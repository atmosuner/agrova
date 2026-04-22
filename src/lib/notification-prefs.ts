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
 * Per-recipient mute for Web Push (edge `web-push-fanout`). Who receives at all is decided by
 * `supabase/functions/_shared/web-push-fanout-recipients.ts` (`resolveWebPushRecipientIds`).
 * `issue.reported` cannot be muted (KPI); mirroring in UI: mute list excludes it.
 */
export function isWebPushActionMutedByPrefs(activityAction: string, prefs: Json | null | undefined): boolean {
  if (activityAction === 'issue.reported') {
    return false
  }
  return readMutedEventActions(prefs).includes(activityAction)
}
