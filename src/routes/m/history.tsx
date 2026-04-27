/* eslint-disable lingui/no-unlocalized-strings */
import { msg, t } from '@lingui/macro'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useMemo } from 'react'
import { Check } from 'lucide-react'
import { activityIdFromDbValue, ACTIVITY_LABEL } from '@/features/tasks/activities'
import { useMyTaskHistoryQuery, type MyTaskHistoryRow } from '@/features/tasks/useMyTaskHistoryQuery'
import { i18n } from '@/lib/i18n'
import { todayISODateInIstanbul } from '@/lib/date-istanbul'

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

function relativeDayLabel(iso: string): string {
  const today = todayISODateInIstanbul()
  if (iso === today) return i18n._(msg`Bugün`)
  // Try Yesterday
  const d = new Date(iso + 'T00:00:00Z')
  const todayDate = new Date(today + 'T00:00:00Z')
  const diff = Math.round((todayDate.getTime() - d.getTime()) / 86400000)
  if (diff === 1) return i18n._(msg`Dün`)
  return new Intl.DateTimeFormat('tr-TR', {
    weekday: 'long',
    timeZone: 'Europe/Istanbul',
  }).format(d)
}

function shortDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z')
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Europe/Istanbul',
  }).format(d)
}

function HistoryPage() {
  const { data, isLoading, loadOlder, isFetching, limit } = useMyTaskHistoryQuery()
  const rows = useMemo(() => data?.rows ?? [], [data?.rows])
  const grouped = useMemo(() => groupByHistoryDay(rows), [rows])
  const keys = useMemo(() => [...grouped.keys()].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0)), [grouped])

  return (
    <div className="pb-6">
      <h1 className="px-4 pb-1 pt-4 text-[22px] font-semibold text-fg">{t`Geçmiş`}</h1>

      {isLoading ? <p className="px-4 pt-2 text-sm text-fg-secondary">{t`Yükleniyor…`}</p> : null}

      <div className="mt-2 flex flex-col">
        {keys.map((d) => (
          <section key={d}>
            <DayHeader label={`${relativeDayLabel(d)} · ${shortDate(d)}`} />
            <ul className="flex flex-col gap-2 px-4">
              {(grouped.get(d) ?? []).map((task) => {
                const aid = activityIdFromDbValue(task.activity)
                const name = aid ? i18n._(ACTIVITY_LABEL[aid]) : task.activity
                return (
                  <li key={task.id}>
                    <Link
                      to="/m/task/$id"
                      params={{ id: task.id }}
                      className="flex items-center gap-3 rounded-2xl border border-border bg-surface-0 px-4 py-3.5"
                    >
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-status-done/[0.10]">
                        {task.status === 'DONE' ? (
                          <Check className="h-5 w-5 text-status-done" strokeWidth={2} aria-label={t`Bitti`} />
                        ) : (
                          <span aria-hidden className="h-2 w-2 rounded-full bg-harvest-500" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-medium text-fg">{name}</p>
                        <p className="truncate text-[13px] text-fg-muted">{task.fields?.name ?? '—'}</p>
                      </div>
                      <span
                        className={
                          task.status === 'DONE'
                            ? 'inline-flex items-center gap-1.5 rounded-full border border-status-done/20 bg-status-done/[0.12] px-2.5 py-0.5 text-[12px] font-medium text-status-done'
                            : 'inline-flex items-center gap-1.5 rounded-full border border-status-blocked/20 bg-status-blocked/[0.12] px-2.5 py-0.5 text-[12px] font-medium text-status-blocked'
                        }
                      >
                        <span
                          aria-hidden
                          className={`h-1.5 w-1.5 rounded-full ${task.status === 'DONE' ? 'bg-status-done' : 'bg-status-blocked'}`}
                        />
                        {task.status === 'DONE' ? i18n._(msg`Bitti`) : task.status}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>

      {rows.length > 0 && rows.length >= limit ? (
        <div className="mt-6 px-4 text-center">
          <button
            type="button"
            className="inline-flex h-10 items-center rounded-full border border-border-strong bg-surface-0 px-6 text-sm font-medium text-fg-secondary transition hover:bg-surface-1 disabled:opacity-60"
            onClick={loadOlder}
            disabled={isFetching}
          >
            {t`Daha fazla yükle`} {isFetching ? '…' : null}
          </button>
        </div>
      ) : null}

      {rows.length === 0 && !isLoading ? (
        <p className="mt-6 text-center text-base text-fg-secondary">{t`Henüz tamamlanan görev yok.`}</p>
      ) : null}
    </div>
  )
}

function DayHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 px-4 pb-2 pt-5">
      <span className="text-[11px] font-medium uppercase tracking-[0.5px] text-fg-faint">{label}</span>
      <span aria-hidden className="h-px flex-1 bg-border" />
    </div>
  )
}
