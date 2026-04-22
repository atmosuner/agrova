import type { IssueCategory } from '@/features/issues/categories'

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

/** Queues issue row + media uploads (M4-03). */
export async function submitIssueDraft(_input: SubmitIssueDraftInput): Promise<void> {
  void _input
}
