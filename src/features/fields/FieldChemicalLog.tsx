/* eslint-disable lingui/no-unlocalized-strings */
import { msg, t } from '@lingui/macro'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { downloadFieldChemicalsCsv } from '@/features/fields/field-chemical-csv'
import { useFieldChemicalApplicationsQuery } from '@/features/fields/useFieldChemicalApplicationsQuery'
import { i18n } from '@/lib/i18n'
import { defaultTasksSearch } from '@/features/tasks/tasks-search'
import { cn } from '@/lib/utils'

type Props = {
  fieldId: string
  fieldName: string
}

function formatTr(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) {
    return iso
  }
  return d.toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })
}

export function FieldChemicalLog({ fieldId, fieldName }: Props) {
  const { data, isLoading, error } = useFieldChemicalApplicationsQuery(fieldId)
  const baseSearch = defaultTasksSearch()
  const rows = data ?? []

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-fg">{i18n._(msg`Kimyasal uygulamalar`)}</h3>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={rows.length === 0}
          onClick={() => downloadFieldChemicalsCsv(fieldName, rows)}
        >
          {t`Download CSV`}
        </Button>
      </div>
      {isLoading ? <p className="text-sm text-fg-secondary">{t`Loading…`}</p> : null}
      {error ? <p className="text-sm text-harvest-500">{error instanceof Error ? error.message : String(error)}</p> : null}
      <ul className="divide-y divide-orchard-100 text-sm">
        {rows.map((r) => (
          <li key={r.id} className={cn('py-2')}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-fg-secondary">{formatTr(r.applied_at)}</span>
              <span className="font-medium text-fg">{r.applicator_name ?? '—'}</span>
            </div>
            <p className="text-fg-secondary">{r.task_activity}</p>
            <Link
              to="/tasks"
              search={{ ...baseSearch, task: r.task_id }}
              className="text-orchard-600 text-xs underline"
            >
              {i18n._(msg`Görev`)}
            </Link>
          </li>
        ))}
      </ul>
      {!isLoading && rows.length === 0 ? (
        <p className="text-fg-secondary text-sm">{i18n._(msg`Bu tarla için kayıt yok.`)}</p>
      ) : null}
    </div>
  )
}
