/* eslint-disable lingui/no-unlocalized-strings -- engineering: IDs and outbox payload keys */
import { db } from '@/lib/db'
import { drainOutbox, enqueueOutbox } from '@/lib/sync'
import type { IssueCategory } from '@/features/issues/categories'
import type { Json } from '@/types/db'

function toJson(p: object): Json {
  return p as unknown as Json
}

export type SubmitIssueDraftInput = {
  category: IssueCategory
  photoJpeg: Blob
  reporterId: string
  taskId?: string | null
  fieldId?: string | null
  gpsLat?: number | null
  gpsLng?: number | null
  voiceBlob?: Blob | null
  voiceContentType?: string | null
}

/**
 * Queues issue insert then photo (then optional voice) in outbox order; drains when online.
 * DB row may list before storage paths are set; uploads retry via drainOutbox on reconnect.
 */
export async function submitIssueDraft(input: SubmitIssueDraftInput): Promise<void> {
  const issueId = globalThis.crypto?.randomUUID?.() ?? `issue-${Date.now()}-${Math.random().toString(16).slice(2)}`
  const photoBlobId = globalThis.crypto?.randomUUID?.() ?? `blob-${Date.now()}-${Math.random().toString(16).slice(2)}`
  await db.blobs.add({ id: photoBlobId, blob: input.photoJpeg })

  const base = Date.now()
  await enqueueOutbox({
    kind: 'issue_row',
    payload: toJson({
      issueId,
      category: input.category,
      reporterId: input.reporterId,
      ...(input.taskId ? { taskId: input.taskId } : {}),
      ...(input.fieldId ? { fieldId: input.fieldId } : {}),
      ...(input.gpsLat != null && !Number.isNaN(input.gpsLat) ? { gpsLat: input.gpsLat } : {}),
      ...(input.gpsLng != null && !Number.isNaN(input.gpsLng) ? { gpsLng: input.gpsLng } : {}),
    }),
    enqueued_at: base,
  })
  await enqueueOutbox({
    kind: 'issue_photo',
    payload: toJson({ issueId, blobId: photoBlobId }),
    enqueued_at: base + 1,
  })
  if (input.voiceBlob) {
    const voiceBlobId = globalThis.crypto?.randomUUID?.() ?? `voice-${Date.now()}-${Math.random().toString(16).slice(2)}`
    await db.blobs.add({ id: voiceBlobId, blob: input.voiceBlob })
    await enqueueOutbox({
      kind: 'issue_voice',
      payload: toJson({
        issueId,
        blobId: voiceBlobId,
        contentType: input.voiceContentType ?? 'audio/webm',
      }),
      enqueued_at: base + 2,
    })
  }
  await drainOutbox()
}
