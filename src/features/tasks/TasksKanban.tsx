/* eslint-disable lingui/no-unlocalized-strings -- Tailwind layout */
import { msg } from '@lingui/macro'
import { ActivityIcon } from '@/components/icons/activities/ActivityIcon'
import { activityIdFromDbValue } from '@/features/tasks/activities'
import { i18n } from '@/lib/i18n'
import type { Enums } from '@/types/db'
import type { TaskListRow } from '@/features/tasks/useTasksQuery'

const COLS: Enums<'task_status'>[] = ['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED', 'CANCELLED']

type Props = {
  rows: TaskListRow[]
  onCardClick: (id: string) => void
}

function colLabel(s: Enums<'task_status'>): string {
  const m = {
    TODO: msg`Yapılacak`,
    IN_PROGRESS: msg`Sürüyor`,
    DONE: msg`Bitti`,
    BLOCKED: msg`Bloke`,
    CANCELLED: msg`İptal`,
  } as const
  return i18n._(m[s])
}

function priorityDot(p: Enums<'task_priority'>): string {
  if (p === 'URGENT') {
    return 'bg-red-500'
  }
  if (p === 'LOW') {
    return 'bg-slate-400'
  }
  return 'bg-orchard-500'
}

export function TasksKanban({ rows, onCardClick }: Props) {
  const byStatus = (st: Enums<'task_status'>) => rows.filter((r) => r.status === st)
  return (
    <div className="grid min-h-[320px] grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-5">
      {COLS.map((st) => (
        <div key={st} className="flex min-w-0 flex-col rounded-lg border border-border bg-surface-1">
          <div className="border-b border-border px-2 py-1.5 text-xs font-semibold text-fg">
            {colLabel(st)} <span className="text-fg-muted">({byStatus(st).length})</span>
          </div>
          <div className="flex-1 space-y-2 p-2">
            {byStatus(st).map((row) => {
              const aid = activityIdFromDbValue(row.activity)
              return (
                <button
                  key={row.id}
                  type="button"
                  className="w-full cursor-pointer rounded-md border border-border bg-surface-0 p-2 text-left text-sm shadow-sm hover:border-orchard-300"
                  onClick={() => onCardClick(row.id)}
                >
                  <div className="mb-1 flex items-start gap-2">
                    {aid ? <ActivityIcon id={aid} className="h-8 w-8 shrink-0" /> : null}
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 font-medium text-fg">{row.activity}</p>
                      <p className="line-clamp-1 text-xs text-fg-secondary">{row.fields?.name ?? '—'}</p>
                    </div>
                    <span
                      className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${priorityDot(row.priority)}`}
                      aria-label={i18n._(msg`Öncelik`)}
                    />
                  </div>
                  <p className="line-clamp-1 text-xs text-fg-secondary">
                    {row.assignee?.full_name ?? '—'}
                  </p>
                  <p className="mt-0.5 text-xs tabular-nums text-fg-muted">{row.due_date}</p>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
