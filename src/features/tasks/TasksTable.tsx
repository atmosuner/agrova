import { msg } from '@lingui/macro'
import { i18n } from '@/lib/i18n'
import type { Enums } from '@/types/db'
import type { TaskListRow } from '@/features/tasks/useTasksQuery'

type Props = {
  rows: TaskListRow[]
  onRowClick: (id: string) => void
}

function statusLabel(s: Enums<'task_status'>): string {
  const m = {
    TODO: msg`Yapılacak`,
    IN_PROGRESS: msg`Sürüyor`,
    DONE: msg`Bitti`,
    BLOCKED: msg`Bloke`,
    CANCELLED: msg`İptal`,
  } as const
  return i18n._(m[s])
}

function priorityLabel(p: Enums<'task_priority'>): string {
  const m = { LOW: msg`Düşük`, NORMAL: msg`Normal`, URGENT: msg`Acil` } as const
  return i18n._(m[p])
}

export function TasksTable({ rows, onRowClick }: Props) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-1 text-fg-secondary">
            <th className="px-2 py-2 font-medium">{i18n._(msg`Aktivite`)}</th>
            <th className="px-2 py-2 font-medium">{i18n._(msg`Tarla`)}</th>
            <th className="px-2 py-2 font-medium">{i18n._(msg`Kime`)}</th>
            <th className="px-2 py-2 font-medium">{i18n._(msg`Durum`)}</th>
            <th className="px-2 py-2 font-medium">{i18n._(msg`Öncelik`)}</th>
            <th className="px-2 py-2 font-medium">{i18n._(msg`Tarih`)}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="cursor-pointer border-b border-border last:border-0 hover:bg-surface-1"
              onClick={() => onRowClick(row.id)}
            >
              <td className="px-2 py-2 text-fg">{row.activity}</td>
              <td className="px-2 py-2 text-fg">{row.fields?.name ?? '—'}</td>
              <td className="px-2 py-2 text-fg">{row.assignee?.full_name ?? '—'}</td>
              <td className="px-2 py-2 text-fg">{statusLabel(row.status)}</td>
              <td className="px-2 py-2 text-fg">{priorityLabel(row.priority)}</td>
              <td className="px-2 py-2 text-fg tabular-nums">{row.due_date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
