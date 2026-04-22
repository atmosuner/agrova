import { msg } from '@lingui/macro'
import { downloadUnparse } from '@/lib/csv-download'
import { i18n } from '@/lib/i18n'
import type { Enums, Tables } from '@/types/db'

type Eq = Tables<'equipment'>
type Cat = Enums<'equipment_category'>

function catTr(c: Cat): string {
  const map = {
    VEHICLE: msg`Vehicles`,
    TOOL: msg`Tools`,
    CHEMICAL: msg`Chemicals`,
    CRATE: msg`Crates`,
  } as const
  return i18n._(map[c])
}

export function downloadEquipmentCsv(rows: Eq[]): void {
  const h = [
    i18n._(msg`Category`),
    i18n._(msg`Name`),
    i18n._(msg`Notes`),
    i18n._(msg`Active`),
    i18n._(msg`Created at`),
  ]
  const data = rows.map((e) => [
    catTr(e.category),
    e.name,
    e.notes ?? '',
    e.active ? i18n._(msg`Active`) : i18n._(msg`Archived`),
    e.created_at,
  ])
  // eslint-disable-next-line lingui/no-unlocalized-strings -- filename base
  downloadUnparse([h, ...data], 'equipment')
}
