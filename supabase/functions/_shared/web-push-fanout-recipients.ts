/**
 * Resolves who should receive a notification row + Web Push for an activity_log event.
 * Keep in sync with `docs/operations/vapid-and-web-push.md` (notification routing).
 *
 * Rules (summary):
 * - `task.created` / `task.duplicated`: the task assignee, unless they are the actor (e.g. self-assign).
 * - `task.reassigned`: previous and new assignee (from payload) plus all owners; never the actor.
 * - `task.started` / `task.done` / `task.blocked` (and other `task.*` not above): all owners except the actor.
 * - `issue.*`: all owners except the actor (e.g. reporter / resolver is not self-notified).
 */

export type ActivityForFanout = {
  actor_id: string
  action: string
  subject_type: string
  subject_id: string
  payload: Record<string, unknown> | null
}

export type TaskForFanout = {
  assignee_id: string
}

export type OwnerRowForFanout = { id: string }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function parsePayloadUuid(p: unknown, key: string): string | null {
  if (!p || typeof p !== "object" || Array.isArray(p)) return null
  return parseUuid((p as Record<string, unknown>)[key])
}

export function parseUuid(v: unknown): string | null {
  if (typeof v !== "string" || !UUID_RE.test(v)) return null
  return v
}

function unique(ids: string[]): string[] {
  return [...new Set(ids)]
}

function excludeActor(ids: string[], actorId: string): string[] {
  return unique(ids).filter((id) => id !== actorId)
}

/**
 * @param task - Required for `task.created` / `task.duplicated` when `subject_type === 'task'`; load `assignee_id` from `public.tasks` by `subject_id`.
 * @param ownerRows - All rows with `role = 'OWNER'`.
 */
export function resolveWebPushRecipientIds(
  act: ActivityForFanout,
  task: TaskForFanout | null,
  ownerRows: OwnerRowForFanout[],
): string[] {
  const ownerIds = ownerRows.map((o) => o.id)
  const actor = act.actor_id

  if (act.subject_type === "task" && (act.action === "task.created" || act.action === "task.duplicated")) {
    if (!task) return []
    if (!task.assignee_id || task.assignee_id === actor) return []
    return [task.assignee_id]
  }

  if (act.subject_type === "task" && act.action === "task.reassigned") {
    const p = act.payload
    const prev = parsePayloadUuid(p, "previous_assignee_id")
    const next = parsePayloadUuid(p, "new_assignee_id")
    const ids: string[] = [...ownerIds]
    if (prev) ids.push(prev)
    if (next) ids.push(next)
    return excludeActor(ids, actor)
  }

  if (act.action.startsWith("issue.")) {
    return excludeActor(ownerIds, actor)
  }

  if (act.subject_type === "task" && (act.action === "task.started" || act.action === "task.done" || act.action === "task.blocked")) {
    return excludeActor(ownerIds, actor)
  }

  if (act.action.startsWith("task.")) {
    return excludeActor(ownerIds, actor)
  }

  return excludeActor(ownerIds, actor)
}
