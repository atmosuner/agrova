/* eslint-disable lingui/no-unlocalized-strings -- Tailwind layout */
import { msg } from '@lingui/macro'
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

function initialsOf(name: string | null): string {
  if (!name) return '—'
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toLocaleUpperCase('tr')
}

export function TasksKanban({ rows, onCardClick }: Props) {
  const byStatus = (st: Enums<'task_status'>) => rows.filter((r) => r.status === st)
  return (
    <div className="grid min-h-[320px] grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-5">
      {COLS.map((st) => {
        const items = byStatus(st)
        return (
          <div key={st} className="flex min-w-0 flex-col rounded-lg border border-border bg-surface-1">
            <div className="flex items-center gap-2 border-b border-border px-3 py-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
                {colLabel(st)}
              </span>
              <span className="inline-flex h-5 items-center rounded bg-surface-2 px-1.5 text-[11px] tabular-nums text-fg-muted">
                {items.length}
              </span>
            </div>
            <div className="flex-1 space-y-2 p-2" role="list">
              {items.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  role="listitem"
                  className="w-full cursor-pointer rounded-lg border border-border bg-surface-0 p-2.5 text-left transition-colors hover:border-orchard-300 focus-visible:ring-2 focus-visible:ring-orchard-500 focus-visible:ring-offset-2"
                  onClick={() => onCardClick(row.id)}
                >
                  <p className="line-clamp-2 text-[12px] font-medium text-fg">{row.activity}</p>
                  <p className="mt-0.5 line-clamp-1 text-[11px] text-fg-muted">
                    {row.fields?.name ?? '—'} · {initialsOf(row.assignee?.full_name ?? null)}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
