/* eslint-disable lingui/no-unlocalized-strings */
import { msg, t } from '@lingui/macro'
import { Link } from '@tanstack/react-router'
import { activityIdFromDbValue, ACTIVITY_LABEL } from '@/features/tasks/activities'
import { ActivityIcon } from '@/components/icons/activities/ActivityIcon'
import type { TaskListRow } from '@/features/tasks/useTasksQuery'
import { i18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import type { MessageDescriptor } from '@lingui/core'

type Props = {
  task: TaskListRow
  className?: string
}

function statusChipClass(status: TaskListRow['status']): string {
  switch (status) {
    case 'TODO':
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800/80 dark:text-slate-200'
    case 'IN_PROGRESS':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-100'
    case 'DONE':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-100'
    case 'BLOCKED':
      return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-100'
    case 'CANCELLED':
    default:
      return 'bg-slate-100 text-slate-600 dark:bg-slate-800/80 dark:text-slate-300'
  }
}

const STATUS: Record<TaskListRow['status'], MessageDescriptor> = {
  TODO: msg`Yapılacak`,
  IN_PROGRESS: msg`Sürüyor`,
  DONE: msg`Bitti`,
  BLOCKED: msg`Bloklu`,
  CANCELLED: msg`İptal`,
}

export function TaskCardMobile({ task, className }: Props) {
  const aid = activityIdFromDbValue(task.activity)
  const name = aid ? i18n._(ACTIVITY_LABEL[aid]) : task.activity

  return (
    <Link
      to="/m/task/$id"
      params={{ id: task.id }}
      className={cn(
        'flex min-h-24 w-full min-w-0 items-stretch gap-3 rounded-xl border border-border bg-surface-0 p-3 text-left shadow-sm transition active:scale-[0.99]',
        className,
      )}
    >
      <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-orchard-50 dark:bg-orchard-500/10">
        {aid ? <ActivityIcon id={aid} className="h-16 w-16 text-orchard-600" /> : null}
      </div>
      <div className="min-w-0 flex-1 py-0.5">
        <p className="line-clamp-2 text-base font-medium text-fg">{name}</p>
        <p className="mt-0.5 truncate text-sm text-fg-secondary">{task.fields?.name ?? '—'}</p>
        <div className="mt-1 flex items-center gap-2">
          <span className={cn('rounded-md px-2 py-0.5 text-xs font-medium', statusChipClass(task.status))}>
            {i18n._(STATUS[task.status] ?? msg`Bilinmiyor`)}
          </span>
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                task.priority === 'URGENT' ? 'bg-harvest-500' : 'bg-surface-2',
              )}
              title={t`Öncelik`}
            />
        </div>
      </div>
    </Link>
  )
}
