/* eslint-disable lingui/no-unlocalized-strings */
import { db } from '@/lib/db'
import { drainOutbox, enqueueOutbox } from '@/lib/sync'
import type { Database, Json } from '@/types/db'

type TaskStatus = Database['public']['Enums']['task_status']

function toJson(p: object): Json {
  return p as unknown as Json
}

export async function queueTaskStatusChange(input: { taskId: string; fromStatus: TaskStatus; toStatus: TaskStatus }): Promise<void> {
  await enqueueOutbox({
    kind: 'task_status',
    payload: toJson({
      taskId: input.taskId,
      fromStatus: input.fromStatus,
      toStatus: input.toStatus,
    }),
  })
  await drainOutbox()
}

export async function queueTaskCompletionWithOptionalPhoto(input: {
  taskId: string
  fromStatus: TaskStatus
  file?: File | null
}): Promise<void> {
  let blobId: string | undefined
  if (input.file) {
    const id = globalThis.crypto?.randomUUID() ?? `blob-${Date.now()}`
    await db.blobs.add({ id, blob: input.file })
    blobId = id
  }
  await enqueueOutbox({
    kind: 'task_completion',
    payload: toJson({
      taskId: input.taskId,
      fromStatus: input.fromStatus,
      toStatus: 'DONE' as const,
      ...(blobId ? { blobId } : {}),
    }),
  })
  await drainOutbox()
}

export async function queueTaskReassign(input: { taskId: string; newAssigneeId: string }): Promise<void> {
  await enqueueOutbox({
    kind: 'task_reassign',
    payload: toJson({ taskId: input.taskId, newAssigneeId: input.newAssigneeId }),
  })
  await drainOutbox()
}

export async function queueTaskEquipmentChange(input: { taskId: string; equipmentId: string; op: 'attach' | 'detach' }): Promise<void> {
  await enqueueOutbox({
    kind: 'task_equipment',
    payload: toJson({
      taskId: input.taskId,
      equipmentId: input.equipmentId,
      op: input.op,
    }),
  })
  await drainOutbox()
}
