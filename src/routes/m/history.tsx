import { t } from '@lingui/macro'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useMemo } from 'react'
import { activityIdFromDbValue, ACTIVITY_LABEL } from '@/features/tasks/activities'
import { useMyTaskHistoryQuery, type MyTaskHistoryRow } from '@/features/tasks/useMyTaskHistoryQuery'
import { i18n } from '@/lib/i18n'
import { formatDayMonthTr } from '@/lib/date-istanbul'
import { Check } from 'lucide-react'

export const Route = createFileRoute('/m/history')({
  component: HistoryPage,
})

function groupDayKey(r: MyTaskHistoryRow): string {
  return r.completed_at ? r.completed_at.slice(0, 10) : r.updated_at.slice(0, 10)
}

function groupByHistoryDay(rows: MyTaskHistoryRow[]): Map<string, MyTaskHistoryRow[]> {
  const m = new Map<string, MyTaskHistoryRow[]>()
  for (const r of rows) {
    const k = groupDayKey(r)
    m.set(k, [...(m.get(k) ?? []), r])
  }
  return m
}

function HistoryPage() {
  const { data, isLoading, loadOlder, isFetching, limit } = useMyTaskHistoryQuery()
  const rows = useMemo(() => data?.rows ?? [], [data?.rows])
  const grouped = useMemo(() => groupByHistoryDay(rows), [rows])
  const keys = useMemo(() => [...grouped.keys()].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0)), [grouped])

  return (
    <div className="px-4 pb-6 pt-4">
      <h1 className="text-xl font-semibold text-fg">{t`Geçmiş`}</h1>
      {isLoading ? <p className="mt-2 text-sm text-fg-secondary">{t`Yükleniyor…`}</p> : null}
      <div className="mt-4 flex flex-col gap-6">
        {keys.map((d) => (
          <section key={d}>
            <h2 className="mb-2 text-sm font-medium capitalize text-fg-muted">{formatDayMonthTr(d)}</h2>
            <ul className="flex flex-col gap-2">
              {(grouped.get(d) ?? []).map((task) => {
                const aid = activityIdFromDbValue(task.activity)
                const name = aid ? i18n._(ACTIVITY_LABEL[aid]) : task.activity
                return (
                  <li key={task.id}>
                    <Link
                      to="/m/task/$id"
                      params={{ id: task.id }}
                      className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface-0 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-fg">{name}</p>
                        <p className="truncate text-xs text-fg-secondary">{task.fields?.name}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {task.status === 'DONE' ? (
                          <Check className="h-4 w-4 text-orchard-500" aria-label={t`Bitti`} />
                        ) : null}
                        {task.status === 'BLOCKED' ? <span className="h-2 w-2 rounded-full bg-harvest-500" /> : null}
                        <span className="text-xs text-fg-faint">{task.status}</span>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
      {rows.length > 0 && rows.length >= limit ? (
        <button
          type="button"
          className="mt-6 w-full rounded-full border border-border py-2 text-sm text-orchard-600"
          onClick={loadOlder}
          disabled={isFetching}
        >
          {t`Daha fazla`} {isFetching ? '…' : null}
        </button>
      ) : null}
      {rows.length === 0 && !isLoading ? (
        <p className="mt-4 text-sm text-fg-secondary">{t`Tamamlanan veya kapanan görev yok.`}</p>
      ) : null}
    </div>
  )
}
