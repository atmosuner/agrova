/* eslint-disable lingui/no-unlocalized-strings -- slugs and DB-facing Turkish activity names */
import { msg } from '@lingui/macro'
import type { MessageDescriptor } from '@lingui/core'

/** Stable keys for activity icons and DB `tasks.activity` text (Turkish labels). */
export const ACTIVITY_IDS = [
  'budama',
  'ilaclama',
  'sulama',
  'gubreleme',
  'seyreltme',
  'hasat',
  'capalama',
  'dikim',
  'asilama',
  'gozlem',
  'don_koruma',
  'bicme',
  'nakliye',
  'diger',
] as const

export type ActivityId = (typeof ACTIVITY_IDS)[number]

export const ACTIVITY_LABEL: Record<ActivityId, MessageDescriptor> = {
  budama: msg`Budama`,
  ilaclama: msg`İlaçlama`,
  sulama: msg`Sulama`,
  gubreleme: msg`Gübreleme`,
  seyreltme: msg`Seyreltme`,
  hasat: msg`Hasat`,
  capalama: msg`Çapalama`,
  dikim: msg`Dikim`,
  asilama: msg`Aşılama`,
  gozlem: msg`Gözlem`,
  don_koruma: msg`Don koruma`,
  bicme: msg`Biçme`,
  nakliye: msg`Nakliye`,
  diger: msg`Diğer`,
}

/** Value stored in `tasks.activity` (user-visible Turkish). */
export function activityIdFromDbValue(db: string): ActivityId | null {
  for (const id of ACTIVITY_IDS) {
    if (activityDbValue(id) === db) {
      return id
    }
  }
  return null
}

export function activityDbValue(id: ActivityId): string {
  // Keep consistent with spec §3; i18n display uses ACTIVITY_LABEL in UI
  const map: Record<ActivityId, string> = {
    budama: 'Budama',
    ilaclama: 'İlaçlama',
    sulama: 'Sulama',
    gubreleme: 'Gübreleme',
    seyreltme: 'Seyreltme',
    hasat: 'Hasat',
    capalama: 'Çapalama',
    dikim: 'Dikim',
    asilama: 'Aşılama',
    gozlem: 'Gözlem',
    don_koruma: 'Don koruma',
    bicme: 'Biçme',
    nakliye: 'Nakliye',
    diger: 'Diğer',
  }
  return map[id]
}
