import type { MessageDescriptor } from '@lingui/core'
import { msg } from '@lingui/macro'
import type { IssueCategory } from '@/features/issues/categories'

export const CATEGORY_LABEL: Record<IssueCategory, MessageDescriptor> = {
  PEST: msg`Zararlı / hastalık`,
  EQUIPMENT: msg`Bozuk alet`,
  INJURY: msg`Yaralanma`,
  IRRIGATION: msg`Sulama sorunu`,
  WEATHER: msg`Hava hasarı`,
  THEFT: msg`Hırsızlık`,
  SUPPLY: msg`Eksik malzeme`,
}
