/* eslint-disable lingui/no-unlocalized-strings -- log / error strings */
import { reassignTask } from '@/features/tasks/reassign-task'
import { db, type OutboxRow } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import type { Database, Json } from '@/types/db'

type TaskStatus = Database['public']['Enums']['task_status']
type IssueCategory = Database['public']['Enums']['issue_category']

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

function asIssueCategory(s: string | undefined, fallback: IssueCategory): IssueCategory {
  const allowed: IssueCategory[] = ['PEST', 'EQUIPMENT', 'INJURY', 'IRRIGATION', 'WEATHER', 'THEFT', 'SUPPLY']
  if (s && (allowed as string[]).includes(s)) {
    return s as IssueCategory
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
    return
  }
  if (row.kind === 'issue_row') {
    const issueId = typeof p.issueId === 'string' ? p.issueId : ''
    const category = asIssueCategory(typeof p.category === 'string' ? p.category : undefined, 'PEST')
    const reporterId = typeof p.reporterId === 'string' ? p.reporterId : ''
    const taskId = typeof p.taskId === 'string' ? p.taskId : null
    const fieldId = typeof p.fieldId === 'string' ? p.fieldId : null
    const gpsLat = typeof p.gpsLat === 'number' ? p.gpsLat : null
    const gpsLng = typeof p.gpsLng === 'number' ? p.gpsLng : null
    if (!issueId || !reporterId) {
      return
    }
    const { data: existing, error: exErr } = await supabase.from('issues').select('id').eq('id', issueId).maybeSingle()
    if (exErr) {
      throw exErr
    }
    if (existing) {
      return
    }
    const rowInsert: Database['public']['Tables']['issues']['Insert'] = {
      id: issueId,
      category,
      reporter_id: reporterId,
      task_id: taskId,
      field_id: fieldId,
      gps_lat: gpsLat,
      gps_lng: gpsLng,
      photo_url: null,
      voice_note_url: null,
    }
    const { error: insErr } = await supabase.from('issues').insert(rowInsert)
    if (insErr) {
      if (insErr.code === '23505') {
        return
      }
      throw insErr
    }
    return
  }
  if (row.kind === 'issue_photo') {
    const issueId = typeof p.issueId === 'string' ? p.issueId : ''
    const blobId = typeof p.blobId === 'string' ? p.blobId : ''
    if (!issueId || !blobId) {
      return
    }
    const { data: issueRow, error: isErr } = await supabase.from('issues').select('id, photo_url').eq('id', issueId).maybeSingle()
    if (isErr) {
      throw isErr
    }
    if (!issueRow) {
      return
    }
    if (issueRow.photo_url) {
      await db.blobs.delete(blobId)
      return
    }
    const blobRow = await db.blobs.get(blobId)
    if (!blobRow?.blob) {
      return
    }
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('no auth')
    }
    const objectPath = `${user.id}/issues/${issueId}.jpg`
    const { error: upErr } = await supabase.storage.from('issue-photos').upload(objectPath, blobRow.blob, {
      upsert: true,
      contentType: 'image/jpeg',
    })
    if (upErr) {
      throw upErr
    }
    const { error: rpcErr } = await supabase.rpc('set_issue_photo_url', {
      p_issue_id: issueId,
      p_path: objectPath,
    })
    if (rpcErr) {
      throw rpcErr
    }
    await db.blobs.delete(blobId)
    return
  }
  if (row.kind === 'issue_voice') {
    const issueId = typeof p.issueId === 'string' ? p.issueId : ''
    const blobId = typeof p.blobId === 'string' ? p.blobId : ''
    const contentType = typeof p.contentType === 'string' ? p.contentType : 'audio/webm'
    if (!issueId || !blobId) {
      return
    }
    const { data: issueRow, error: isErr } = await supabase
      .from('issues')
      .select('id, voice_note_url')
      .eq('id', issueId)
      .maybeSingle()
    if (isErr) {
      throw isErr
    }
    if (!issueRow) {
      return
    }
    if (issueRow.voice_note_url) {
      await db.blobs.delete(blobId)
      return
    }
    const blobRow = await db.blobs.get(blobId)
    if (!blobRow?.blob) {
      return
    }
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('no auth')
    }
    const ext = contentType.includes('webm') ? 'webm' : contentType.includes('mpeg') ? 'mp3' : 'm4a'
    const objectPath = `${user.id}/issues/${issueId}.${ext}`
    const { error: upErr } = await supabase.storage.from('issue-photos').upload(objectPath, blobRow.blob, {
      upsert: true,
      contentType,
    })
    if (upErr) {
      throw upErr
    }
    const { error: rpcErr } = await supabase.rpc('set_issue_voice_note_url', {
      p_issue_id: issueId,
      p_path: objectPath,
    })
    if (rpcErr) {
      throw rpcErr
    }
    await db.blobs.delete(blobId)
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
  item: Pick<OutboxRow, 'kind' | 'payload'> & Partial<Pick<OutboxRow, 'client_uuid' | 'enqueued_at'>>,
): Promise<string> {
  const id = newUUID()
  const row: OutboxRow = {
    id,
    kind: item.kind,
    payload: item.payload,
    client_uuid: item.client_uuid ?? newUUID(),
    enqueued_at: item.enqueued_at ?? Date.now(),
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
