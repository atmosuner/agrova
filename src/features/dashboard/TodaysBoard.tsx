import { msg, t } from '@lingui/macro'
import { Link } from '@tanstack/react-router'
import { activityIdFromDbValue, ACTIVITY_LABEL } from '@/features/tasks/activities'
import { tasksSearchDueOn } from '@/features/tasks/tasks-search'
import {
  columnForStatus,
  useTodaysBoardTasks,
  type BoardTaskRow,
} from '@/features/dashboard/use-todays-board-tasks'
import { todayISODateInIstanbul } from '@/lib/date-istanbul'
import { i18n } from '@/lib/i18n'

const COL: { key: 'TODO' | 'IN_PROGRESS' | 'DONE'; label: () => string }[] = [
  { key: 'TODO', label: () => i18n._(msg`Yapılacak`) },
  { key: 'IN_PROGRESS', label: () => i18n._(msg`Sürüyor`) },
  { key: 'DONE', label: () => i18n._(msg`Bitti`) },
]

const MAX = 5

type Props = {
  onOpenTask: (taskId: string) => void
}

export function TodaysBoard({ onOpenTask }: Props) {
  const { data, isLoading } = useTodaysBoardTasks()
  const day = todayISODateInIstanbul()
  const rows = data ?? []

  return (
    <section className="rounded-xl border border-border bg-surface-0 p-5" aria-label={i18n._(msg`Bugünkü görev panosu`)}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-fg">{i18n._(msg`Bugünün Panosu`)}</h2>
        <Link to="/tasks" search={tasksSearchDueOn(day)} className="text-xs font-medium text-orchard-600 hover:underline">
          {t`Görevlere git`} →
        </Link>
      </div>
      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-3">
          {COL.map((c) => (
            <div key={c.key} className="min-h-32 animate-pulse rounded-lg bg-surface-1" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-3">
          {COL.map((col) => {
            const all = rows.filter((r) => columnForStatus(r.status) === col.key)
            const inCol = all.slice(0, MAX)
            const overflow = all.length - inCol.length
            return (
              <div key={col.key} className="flex min-h-40 flex-col rounded-lg border border-border bg-canvas p-2">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase text-fg-secondary">{col.label()}</span>
                  <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-surface-2 px-1 text-[10px] font-medium tabular-nums text-fg-muted">
                    {all.length}
                  </span>
                </div>
                <ul className="flex flex-1 flex-col gap-1.5">
                  {inCol.length === 0 ? (
                    <li className="text-xs text-fg-muted">{i18n._(msg`Boş`)}</li>
                  ) : (
                    inCol.map((r) => (
                      <li key={r.id}>
                        <TaskCardRow row={r} onOpen={() => onOpenTask(r.id)} />
                      </li>
                    ))
                  )}
                </ul>
                {overflow > 0 && (
                  <p className="mt-1.5 text-center text-[11px] text-fg-muted">
                    +{overflow} {i18n._(msg`görev daha`)}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

function initialsOf(name: string | null | undefined): string {
  if (!name?.trim()) return '—'
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '')).toUpperCase()
}

function TaskCardRow({ row, onOpen }: { row: BoardTaskRow; onOpen: () => void }) {
  const aid = activityIdFromDbValue(row.activity)
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-md border border-border bg-surface-0 p-2 text-left transition-colors hover:border-orchard-300 focus-visible:ring-2 focus-visible:ring-orchard-500 focus-visible:ring-offset-2"
    >
      <p className="line-clamp-2 text-[12px] font-medium text-fg">
        {aid ? i18n._(ACTIVITY_LABEL[aid]) : row.activity}
      </p>
      <p className="mt-0.5 line-clamp-1 text-[11px] text-fg-muted">
        {row.fields?.name ?? '—'} · {initialsOf(row.assignee?.full_name)}
      </p>
    </button>
  )
}
