import { msg, t } from '@lingui/macro'
import { Link } from '@tanstack/react-router'
import { ActivityIcon } from '@/components/icons/activities/ActivityIcon'
import { activityIdFromDbValue, ACTIVITY_LABEL } from '@/features/tasks/activities'
import { tasksSearchDueOn } from '@/features/tasks/tasks-search'
import {
  columnForStatus,
  useTodaysBoardTasks,
  type BoardTaskRow,
} from '@/features/dashboard/use-todays-board-tasks'
import { todayISODateInIstanbul } from '@/lib/date-istanbul'
import { i18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import type { Enums } from '@/types/db'

const COL: { key: 'TODO' | 'IN_PROGRESS' | 'DONE'; label: () => string }[] = [
  { key: 'TODO', label: () => i18n._(msg`Yapılacak`) },
  { key: 'IN_PROGRESS', label: () => i18n._(msg`Sürüyor`) },
  { key: 'DONE', label: () => i18n._(msg`Bitti`) },
]

const MAX = 10

function statusLabel(s: Enums<'task_status'>): string {
  const m = {
    TODO: msg`TODO`,
    IN_PROGRESS: msg`Sürüyor`,
    DONE: msg`Bitti`,
    BLOCKED: msg`Bloke`,
    CANCELLED: msg`İptal`,
  } as const
  return i18n._(m[s] ?? msg`—`)
}

type Props = {
  onOpenTask: (taskId: string) => void
}

export function TodaysBoard({ onOpenTask }: Props) {
  const { data, isLoading } = useTodaysBoardTasks()
  const day = todayISODateInIstanbul()
  const rows = data ?? []

  return (
    <section className="rounded-xl border border-border bg-surface-0 p-4" aria-label={i18n._(msg`Bugünkü görev panosu`)}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-fg">{i18n._(msg`Bugün — pano`)}</h2>
        <Link to="/tasks" search={tasksSearchDueOn(day)} className="text-xs font-medium text-orchard-600 hover:underline">
          {t`Tümünü göster`}
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
            const inCol = rows.filter((r) => columnForStatus(r.status) === col.key).slice(0, MAX)
            return (
              <div key={col.key} className="flex min-h-40 flex-col rounded-lg border border-border bg-canvas p-2">
                <div className="mb-2 text-xs font-medium text-fg-secondary">{col.label()}</div>
                <ul className="flex flex-1 flex-col gap-2">
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
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

function TaskCardRow({ row, onOpen }: { row: BoardTaskRow; onOpen: () => void }) {
  const aid = activityIdFromDbValue(row.activity)
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'flex w-full items-start gap-2 rounded-md border border-transparent p-2 text-left transition',
        'hover:border-border hover:bg-surface-0',
      )}
    >
      {aid ? <ActivityIcon id={aid} className="h-6 w-6 shrink-0 text-orchard-600" /> : <span className="h-6 w-6" />}
      <span className="min-w-0">
        <span className="line-clamp-2 text-xs font-medium text-fg">
          {aid ? i18n._(ACTIVITY_LABEL[aid]) : row.activity}
        </span>
        <span className="line-clamp-1 text-[11px] text-fg-muted">
          {row.fields?.name ?? '—'} · {row.assignee?.full_name ?? '—'}
        </span>
        <span className="text-[10px] text-fg-faint">{statusLabel(row.status)}</span>
      </span>
    </button>
  )
}
