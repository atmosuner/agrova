/* eslint-disable lingui/no-unlocalized-strings -- IndexedDB store names */
import Dexie, { type Table } from 'dexie'
import type { Json } from '@/types/db'

export type OutboxKind =
  | 'task_status'
  | 'task_reassign'
  | 'task_completion'
  | 'issue_row'
  | 'issue_photo'
  | 'issue_voice'

export type OutboxRow = {
  id: string
  kind: OutboxKind
  /** JSON-serializable payload; large blobs use `blobId` pointing at `blobs` table */
  payload: Json
  client_uuid: string
  enqueued_at: number
  attempts: number
  last_error: string | null
}

export type CachedField = { id: string; name: string; data: Json }
export type CachedPerson = { id: string; full_name: string; phone: string; role: string; data: Json }
export type CachedTaskRow = Json

class AgrovaDexie extends Dexie {
  outbox!: Table<OutboxRow, string>
  fields!: Table<CachedField, string>
  people!: Table<CachedPerson, string>
  equipment!: Table<{ id: string; data: Json }, string>
  activities!: Table<{ id: string; label: string }, string>
  issue_categories!: Table<{ id: string; data: Json }, string>
  tasks_today!: Table<{ id: string; due_date: string; data: Json }, string>
  blobs!: Table<{ id: string; blob: Blob }, string>

  constructor() {
    super('agrova')
    this.version(1).stores({})
    this.version(2).stores({
      outbox: 'id, enqueued_at, kind, client_uuid',
      fields: 'id',
      people: 'id',
      equipment: 'id',
      activities: 'id',
      issue_categories: 'id',
      tasks_today: 'id, due_date',
      blobs: 'id',
    })
  }
}

export const db = new AgrovaDexie()
