import { msg } from '@lingui/macro'
import { downloadUnparse } from '@/lib/csv-download'
import { i18n } from '@/lib/i18n'
import type { Tables } from '@/types/db'

type Person = Tables<'people'>

function roleTr(role: Person['role']): string {
  const map = {
    OWNER: msg`Owner`,
    FOREMAN: msg`Foreman`,
    AGRONOMIST: msg`Agronomist`,
    WORKER: msg`Worker`,
  } as const
  return i18n._(map[role])
}

/** UTF-8 BOM + Turkish header row, filename `people-YYYYMMDD.csv`. */
export function downloadPeopleCsv(rows: Person[]): void {
  const h = [
    i18n._(msg`Full name`),
    i18n._(msg`Phone`),
    i18n._(msg`Role`),
    i18n._(msg`Status`),
  ]
  const data = rows.map((p) => [p.full_name, p.phone, roleTr(p.role), p.active ? i18n._(msg`Active`) : i18n._(msg`Archived`)] as (string | number)[])
  // eslint-disable-next-line lingui/no-unlocalized-strings -- filename base
  downloadUnparse([h, ...data] as (string | number)[][], 'people')
}
