/* eslint-disable lingui/no-unlocalized-strings -- log / error strings */
import { reassignTask } from '@/features/tasks/reassign-task'
import { db, type OutboxRow } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import type { Database, Json } from '@/types/db'

type TaskStatus = Database['public']['Enums']['task_status']

const BACKOFF_MS = [5_000, 30_000, 120_000, 600_000, 900_000] as const
let lastDrainErrorAt = 0
let backoffStep = 0
let drainInFlight: Promise<void> | null = null

function isPayloadRecord(p: Json): p is { [k: string]: Json | undefined } {
  return typeof p === 'object' && p !== null && !Array.isArray(p)
}

function asTaskStatus(s: string | undefined, fallback: TaskStatus): TaskStatus {
  if (s === 'TODO' || s === 'IN_PROGRESS' || s === 'DONE' || s === 'BLOCKED' || s === 'CANCELLED') {
    return s
  }
  return fallback
}

async function processRow(row: OutboxRow): Promise<void> {
  if (!isPayloadRecord(row.payload)) {
    return
  }
  const p = row.payload
  if (row.kind === 'task_status' || row.kind === 'task_completion') {
    const taskId = typeof p.taskId === 'string' ? p.taskId : ''
    const fromStatus = asTaskStatus(typeof p.fromStatus === 'string' ? p.fromStatus : undefined, 'TODO')
    const toStatus = asTaskStatus(typeof p.toStatus === 'string' ? p.toStatus : undefined, 'TODO')
    if (!taskId) {
      return
    }
    const { data: cur, error: selErr } = await supabase
      .from('tasks')
      .select('id, status, assignee_id')
      .eq('id', taskId)
      .maybeSingle()
    if (selErr) {
      throw selErr
    }
    if (!cur) {
      return
    }
    if (cur.status !== fromStatus) {
      await db.outbox.delete(row.id)
      return
    }
    let photoUrl: string | null | undefined
    if (row.kind === 'task_completion' && typeof p.blobId === 'string') {
      const blobRow = await db.blobs.get(p.blobId)
      if (blobRow?.blob) {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          throw new Error('no auth')
        }
        const objectPath = `${user.id}/task-${taskId}-completion.jpg`
        const { error: upErr } = await supabase.storage.from('issue-photos').upload(objectPath, blobRow.blob, {
          upsert: true,
        })
        if (upErr) {
          throw upErr
        }
        /** Private bucket: storage object path (bucket `issue-photos`); sign at read time in owner UI. */
        photoUrl = objectPath
        await db.blobs.delete(p.blobId)
      }
    }
    const patch: Database['public']['Tables']['tasks']['Update'] = {
      status: toStatus,
      completed_at: toStatus === 'DONE' ? new Date().toISOString() : null,
      ...(photoUrl ? { completion_photo_url: photoUrl } : {}),
    }
    const { error: uErr } = await supabase
      .from('tasks')
      .update(patch)
      .eq('id', taskId)
      .eq('status', fromStatus)
    if (uErr) {
      throw uErr
    }
    return
  }
  if (row.kind === 'task_reassign') {
    const taskId = typeof p.taskId === 'string' ? p.taskId : ''
    const newAssigneeId = typeof p.newAssigneeId === 'string' ? p.newAssigneeId : ''
    if (!taskId || !newAssigneeId) {
      return
    }
    await reassignTask(supabase, { taskId, newAssigneeId })
  }
}

export async function drainOutbox(): Promise<void> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return
  }
  if (drainInFlight) {
    return drainInFlight
  }
  drainInFlight = (async () => {
    const now = Date.now()
    if (now - lastDrainErrorAt < (BACKOFF_MS[Math.min(backoffStep, BACKOFF_MS.length - 1)] ?? 5_000)) {
      return
    }
    const rows = await db.outbox.orderBy('enqueued_at').toArray()
    for (const row of rows) {
      try {
        await processRow(row)
        await db.outbox.delete(row.id)
        backoffStep = 0
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        lastDrainErrorAt = Date.now()
        backoffStep = Math.min(backoffStep + 1, BACKOFF_MS.length - 1)
        await db.outbox.update(row.id, {
          attempts: row.attempts + 1,
          last_error: msg,
        })
        break
      }
    }
  })()
  try {
    await drainInFlight
  } finally {
    drainInFlight = null
  }
}

let uuidFn: (() => string) | null = null
function newUUID(): string {
  if (!uuidFn) {
    uuidFn = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
  }
  return uuidFn()
}

export async function enqueueOutbox(
  item: Pick<OutboxRow, 'kind' | 'payload'> & Partial<Pick<OutboxRow, 'client_uuid'>>,
): Promise<string> {
  const id = newUUID()
  const row: OutboxRow = {
    id,
    kind: item.kind,
    payload: item.payload,
    client_uuid: item.client_uuid ?? newUUID(),
    enqueued_at: Date.now(),
    attempts: 0,
    last_error: null,
  }
  await db.outbox.add(row)
  return id
}

export function resetSyncBackoffForTests(): void {
  lastDrainErrorAt = 0
  backoffStep = 0
}
