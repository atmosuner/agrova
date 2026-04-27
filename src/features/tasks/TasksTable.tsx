import { msg } from '@lingui/macro'
import { format, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'
import { activityIdFromDbValue, ACTIVITY_LABEL } from '@/features/tasks/activities'
import { i18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import type { Enums } from '@/types/db'
import type { TaskListRow } from '@/features/tasks/useTasksQuery'

type Props = {
  rows: TaskListRow[]
  selectedIds: Set<string>
  onSelectionChange: (ids: Set<string>) => void
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

/* eslint-disable lingui/no-unlocalized-strings -- Tailwind token strings */
const STATUS_STYLE: Record<Enums<'task_status'>, string> = {
  TODO: 'bg-sky-100 text-sky-700',
  IN_PROGRESS: 'bg-emerald-100 text-emerald-700',
  DONE: 'bg-surface-2 text-fg-muted',
  BLOCKED: 'bg-amber-100 text-amber-700',
  CANCELLED: 'bg-surface-2 text-fg-muted line-through',
}
/* eslint-enable lingui/no-unlocalized-strings */

/* eslint-disable lingui/no-unlocalized-strings -- Tailwind class token strings */
const AVATAR_COLORS = [
  'bg-orchard-100 text-orchard-700',
  'bg-sky-100 text-sky-700',
  'bg-amber-100 text-amber-700',
  'bg-violet-100 text-violet-700',
  'bg-rose-100 text-rose-700',
  'bg-teal-100 text-teal-700',
] as const
/* eslint-enable lingui/no-unlocalized-strings */

function initialsOf(name: string | null | undefined): string {
  if (!name?.trim()) return '\u2014'
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '')).toUpperCase()
}

function abbreviateName(name: string | null | undefined): string {
  if (!name?.trim()) return '\u2014'
  const parts = name.trim().split(/\s+/)
  if (parts.length < 2) return parts[0] ?? '\u2014'
  return `${parts[0]} ${(parts[parts.length - 1]?.[0] ?? '').toUpperCase()}.`
}

function avatarColor(name: string | null | undefined): string {
  if (!name) return AVATAR_COLORS[0]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length] ?? AVATAR_COLORS[0]
}

function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return '\u2014'
  try {
    // eslint-disable-next-line lingui/no-unlocalized-strings -- date-fns format token
    return format(parseISO(iso), 'd MMM', { locale: tr })
  } catch {
    return iso
  }
}

export function TasksTable({ rows, selectedIds, onSelectionChange, onRowClick }: Props) {
  const allChecked = rows.length > 0 && rows.every((r) => selectedIds.has(r.id))
  const someChecked = rows.some((r) => selectedIds.has(r.id))

  function toggleAll() {
    if (allChecked) {
      onSelectionChange(new Set())
    } else {
      onSelectionChange(new Set(rows.map((r) => r.id)))
    }
  }

  function toggleOne(id: string) {
    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    onSelectionChange(next)
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[720px] border-collapse text-left text-[13px]">
        <thead>
          <tr className="border-b border-border bg-surface-1">
            <th className="w-10 px-3 py-2.5">
              <input
                type="checkbox"
                checked={allChecked}
                ref={(el) => { if (el) el.indeterminate = someChecked && !allChecked }}
                onChange={toggleAll}
                className="h-3.5 w-3.5 rounded border-border accent-orchard-500"
                aria-label={i18n._(msg`Tümünü seç`)}
              />
            </th>
            <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-fg-secondary">{i18n._(msg`Görev`)}</th>
            <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-fg-secondary">{i18n._(msg`Tarla`)}</th>
            <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-fg-secondary">{i18n._(msg`Kime`)}</th>
            <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-fg-secondary">{i18n._(msg`Durum`)}</th>
            <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-fg-secondary">{i18n._(msg`Son tarih`)}</th>
            <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-fg-secondary">{i18n._(msg`Aktivite`)}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const checked = selectedIds.has(row.id)
            const aid = activityIdFromDbValue(row.activity)
            const activityLabel = aid ? i18n._(ACTIVITY_LABEL[aid]) : row.activity
            const fieldLabel = row.fields?.name ?? '\u2014'

            return (
              <tr
                key={row.id}
                className={cn(
                  'cursor-pointer border-b border-border last:border-0 transition-colors',
                  checked ? 'bg-orchard-50/50' : 'hover:bg-surface-1',
                )}
                onClick={() => onRowClick(row.id)}
              >
                <td className="w-10 px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleOne(row.id)}
                    className="h-3.5 w-3.5 rounded border-border accent-orchard-500"
                  />
                </td>
                <td className="px-3 py-2.5 font-medium text-fg">{activityLabel}</td>
                <td className="px-3 py-2.5 text-fg">{fieldLabel}</td>
                <td className="px-3 py-2.5">
                  <span className="inline-flex items-center gap-1.5">
                    <span className={cn('inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold', avatarColor(row.assignee?.full_name))}>
                      {initialsOf(row.assignee?.full_name)}
                    </span>
                    <span className="text-fg">{abbreviateName(row.assignee?.full_name)}</span>
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium', STATUS_STYLE[row.status])}>
                    {statusLabel(row.status)}
                  </span>
                </td>
                <td className="px-3 py-2.5 tabular-nums text-fg">{formatShortDate(row.due_date)}</td>
                <td className="px-3 py-2.5 text-fg-secondary">{activityLabel}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
