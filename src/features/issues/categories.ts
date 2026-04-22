/* eslint-disable lingui/no-unlocalized-strings -- engineering zone: DB enum codes */
import type { Enums } from '@/types/db'

export type IssueCategory = Enums<'issue_category'>

/** Display order for the worker grid (English enum codes). */
export const ISSUE_CATEGORY_ORDER: readonly IssueCategory[] = [
  'PEST',
  'EQUIPMENT',
  'INJURY',
  'IRRIGATION',
  'WEATHER',
  'THEFT',
  'SUPPLY',
] as const
