/* eslint-disable lingui/no-unlocalized-strings -- locale API, filename sanitizer */
import { msg } from '@lingui/macro'
import { downloadUnparse } from '@/lib/csv-download'
import { i18n } from '@/lib/i18n'
import type { FieldChemicalRow } from '@/features/fields/useFieldChemicalApplicationsQuery'

function formatApplied(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) {
    return iso
  }
  return d.toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })
}

function rowToCsv(c: FieldChemicalRow): (string | number)[] {
  return [formatApplied(c.applied_at), c.applicator_name ?? '', c.task_activity, c.task_id]
}

export function downloadFieldChemicalsCsv(fieldName: string, rows: FieldChemicalRow[]): void {
  const h = [i18n._(msg`Date`), i18n._(msg`Applicator`), i18n._(msg`Activity`), i18n._(msg`Task id`)]
  const data = rows.map(rowToCsv)
  const safe = fieldName.replace(/[/\\?%*:|"<>]/g, '-').trim() || 'field'
  downloadUnparse([h, ...data], `field-chemicals-${safe}`)
}
