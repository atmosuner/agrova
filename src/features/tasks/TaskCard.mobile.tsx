/* eslint-disable lingui/no-unlocalized-strings */
import { msg } from '@lingui/macro'
import { Link } from '@tanstack/react-router'
import { activityIdFromDbValue, ACTIVITY_LABEL } from '@/features/tasks/activities'
import { ActivityIcon } from '@/components/icons/activities/ActivityIcon'
import type { TaskListRow } from '@/features/tasks/useTasksQuery'
import { i18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const STATUS_PILL: Record<TaskListRow['status'], { label: ReturnType<typeof msg>; cls: string }> = {
  TODO: {
    label: msg`Yapılacak`,
    cls: 'border-status-todo/20 bg-status-todo/[0.12] text-status-todo',
  },
  IN_PROGRESS: {
    label: msg`Sürüyor`,
    cls: 'border-status-progress/20 bg-status-progress/[0.12] text-status-progress',
  },
  DONE: {
    label: msg`Bitti`,
    cls: 'border-status-done/20 bg-status-done/[0.12] text-status-done',
  },
  BLOCKED: {
    label: msg`Bloklu`,
    cls: 'border-status-blocked/20 bg-status-blocked/[0.12] text-status-blocked',
  },
  CANCELLED: {
    label: msg`İptal`,
    cls: 'border-status-cancelled/20 bg-status-cancelled/[0.12] text-status-cancelled',
  },
}

export function StatusPill({ status, className }: { status: TaskListRow['status']; className?: string }) {
  const meta = STATUS_PILL[status]
  if (!meta) return null
  const dotColors: Record<TaskListRow['status'], string> = {
    TODO: 'bg-status-todo',
    IN_PROGRESS: 'bg-status-progress',
    DONE: 'bg-status-done',
    BLOCKED: 'bg-status-blocked',
    CANCELLED: 'bg-status-cancelled',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[12px] font-medium',
        meta.cls,
        className,
      )}
    >
      <span aria-hidden className={cn('h-1.5 w-1.5 rounded-full', dotColors[status])} />
      {i18n._(meta.label)}
    </span>
  )
}

/**
 * Hero "next task" card used at the top of /m/tasks.
 * 96px activity icon, 24px title, 72px primary CTA — gloves-friendly.
 */
export function FocusTaskCard({ task, primaryLabel }: { task: TaskListRow; primaryLabel: string }) {
  const aid = activityIdFromDbValue(task.activity)
  const name = aid ? i18n._(ACTIVITY_LABEL[aid]) : task.activity
  return (
    <Link
      to="/m/task/$id"
      params={{ id: task.id }}
      className="block rounded-[20px] border border-border bg-surface-0 p-5 transition active:scale-[0.99]"
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.5px] text-fg-faint">
        {i18n._(msg`Sıradaki göreviniz`)}
      </p>
      <div className="mt-4 flex h-24 w-24 items-center justify-center rounded-3xl bg-orchard-50 dark:bg-orchard-500/10">
        {aid ? <ActivityIcon id={aid} className="h-14 w-14 text-orchard-500" /> : null}
      </div>
      <h2 className="mt-4 text-[24px] font-semibold leading-[1.15] text-fg">{name}</h2>
      <p className="mt-1 text-base text-fg-secondary">{task.fields?.name ?? '—'}</p>
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        {task.priority === 'URGENT' ? (
          <span className="rounded-md bg-status-blocked/[0.12] px-2 py-0.5 text-[12px] font-medium text-status-blocked">
            {i18n._(msg`Öncelikli`)}
          </span>
        ) : null}
        <StatusPill status={task.status} />
      </div>
      <span
        className={cn(
          'mt-5 inline-flex h-[72px] w-full items-center justify-center rounded-full text-xl font-semibold text-white transition',
          task.status === 'IN_PROGRESS' ? 'bg-status-done' : 'bg-orchard-500',
        )}
      >
        {primaryLabel}
      </span>
    </Link>
  )
}

/**
 * Compact card for the "Bugün daha" stack below the focus card.
 */
export function LaterTaskCard({ task }: { task: TaskListRow }) {
  const aid = activityIdFromDbValue(task.activity)
  const name = aid ? i18n._(ACTIVITY_LABEL[aid]) : task.activity
  return (
    <Link
      to="/m/task/$id"
      params={{ id: task.id }}
      className="flex items-center gap-3 rounded-2xl border border-border bg-surface-0 px-4 py-3.5 transition hover:bg-surface-1 active:scale-[0.99]"
    >
      <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-1">
        {aid ? <ActivityIcon id={aid} className="h-6 w-6 text-fg-secondary" /> : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-medium text-fg">{name}</span>
        <span className="block truncate text-[13px] text-fg-muted">{task.fields?.name ?? '—'}</span>
      </span>
      <StatusPill status={task.status} />
    </Link>
  )
}

/** Backwards-compatible default — alias for the focus-style hero. */
export function TaskCardMobile({ task }: { task: TaskListRow }) {
  return <LaterTaskCard task={task} />
}
