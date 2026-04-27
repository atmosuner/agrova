/* eslint-disable lingui/no-unlocalized-strings -- Tailwind class strings, search param keys */
import { msg, t } from '@lingui/macro'
import { useRef, useState } from 'react'
import { LayoutGrid, List, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ACTIVITY_IDS, ACTIVITY_LABEL, activityDbValue } from '@/features/tasks/activities'
import type { TasksSearchState, TasksViewMode } from '@/features/tasks/tasks-search'
import type { FieldRow } from '@/features/tasks/useFieldsQuery'
import { useOnClickOutside } from '@/lib/use-on-click-outside'
import { i18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import type { Enums } from '@/types/db'

const STATUSES: Enums<'task_status'>[] = ['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED', 'CANCELLED']

function statusTr(s: Enums<'task_status'>): string {
  const m = {
    TODO: msg`Yapılacak`,
    IN_PROGRESS: msg`Sürüyor`,
    DONE: msg`Bitti`,
    BLOCKED: msg`Bloke`,
    CANCELLED: msg`İptal`,
  } as const
  return i18n._(m[s])
}

type PersonRow = { id: string; full_name: string | null; role: string | null }

type Props = {
  search: TasksSearchState
  fieldOpts: FieldRow[]
  peopleOpts: PersonRow[]
  onPatch: (partial: Partial<TasksSearchState>) => void
  onCreate?: () => void
}

export function FilterBar({ search, fieldOpts, peopleOpts, onPatch, onCreate }: Props) {
  const activeChips: { key: string; label: string; onClear: () => void }[] = []

  if (search.status) {
    activeChips.push({
      key: 'status',
      label: `${i18n._(msg`Durum`)}: ${statusTr(search.status)}`,
      onClear: () => onPatch({ status: null, page: 0 }),
    })
  }
  if (search.field) {
    const f = fieldOpts.find((o) => o.id === search.field)
    activeChips.push({
      key: 'field',
      label: `${i18n._(msg`Tarla`)}: ${f?.name ?? search.field}`,
      onClear: () => onPatch({ field: null, page: 0 }),
    })
  }
  if (search.assignee) {
    const p = peopleOpts.find((o) => o.id === search.assignee)
    activeChips.push({
      key: 'assignee',
      label: `${i18n._(msg`Kime`)}: ${p?.full_name ?? search.assignee}`,
      onClear: () => onPatch({ assignee: null, page: 0 }),
    })
  }
  if (search.activity) {
    const a = ACTIVITY_IDS.find((id) => activityDbValue(id) === search.activity)
    activeChips.push({
      key: 'activity',
      label: `${i18n._(msg`Aktivite`)}: ${a ? i18n._(ACTIVITY_LABEL[a]) : search.activity}`,
      onClear: () => onPatch({ activity: null, page: 0 }),
    })
  }
  if (search.dueFrom || search.dueTo) {
    const parts: string[] = []
    if (search.dueFrom) parts.push(search.dueFrom)
    if (search.dueTo) parts.push(search.dueTo)
    activeChips.push({
      key: 'date',
      label: `${i18n._(msg`Tarih`)}: ${parts.join(' → ')}`,
      onClear: () => onPatch({ dueFrom: null, dueTo: null, page: 0 }),
    })
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {activeChips.map((c) => (
        <ActiveChip key={c.key} label={c.label} onClear={c.onClear} />
      ))}

      {activeChips.length > 0 && (
        <div className="mx-0.5 h-5 w-px bg-border-strong" aria-hidden />
      )}

      {!search.status && (
        <PopoverChip
          label={`+ ${i18n._(msg`Durum`)}`}
          items={STATUSES.map((s) => ({ id: s, label: statusTr(s) }))}
          onSelect={(id) => onPatch({ status: id as Enums<'task_status'>, page: 0 })}
        />
      )}
      {!search.field && (
        <PopoverChip
          label={`+ ${i18n._(msg`Tarla`)}`}
          items={fieldOpts.map((f) => ({ id: f.id, label: f.name }))}
          onSelect={(id) => onPatch({ field: id, page: 0 })}
        />
      )}
      {!search.assignee && (
        <PopoverChip
          label={`+ ${i18n._(msg`Kime`)}`}
          items={peopleOpts.map((p) => ({ id: p.id, label: p.full_name ?? '—' }))}
          onSelect={(id) => onPatch({ assignee: id, page: 0 })}
        />
      )}
      {!search.activity && (
        <PopoverChip
          label={`+ ${i18n._(msg`Aktivite`)}`}
          items={ACTIVITY_IDS.map((id) => ({ id: activityDbValue(id), label: i18n._(ACTIVITY_LABEL[id]) }))}
          onSelect={(id) => onPatch({ activity: id, page: 0 })}
        />
      )}
      {!search.dueFrom && !search.dueTo && (
        <DateChip onApply={(from, to) => onPatch({ dueFrom: from || null, dueTo: to || null, page: 0 })} />
      )}

      <div className="mx-0.5 h-5 w-px bg-border-strong" aria-hidden />

      <button
        type="button"
        onClick={() => onPatch({ showFinished: !search.showFinished, page: 0 })}
        className={cn(
          'inline-flex h-[30px] items-center rounded-[7px] border px-2.5 text-[12px] font-medium transition-colors',
          search.showFinished
            ? 'border-orchard-500/30 bg-orchard-50 text-orchard-700 hover:bg-orchard-100'
            : 'border-border bg-surface-0 text-fg-secondary hover:border-border-strong hover:text-fg',
        )}
      >
        {t`Tamamlananlar`}
        {search.showFinished && <X className="ml-1 h-3 w-3" />}
      </button>

      <div className="ml-auto flex items-center gap-2">
        <div className="flex gap-1">
          <ViewIconButton
            active={search.view === 'table'}
            icon={<List className="h-4 w-4" strokeWidth={1.75} />}
            label={i18n._(msg`Tablo`)}
            onClick={() => onPatch({ view: 'table' as TasksViewMode })}
          />
          <ViewIconButton
            active={search.view === 'kanban'}
            icon={<LayoutGrid className="h-4 w-4" strokeWidth={1.75} />}
            label={i18n._(msg`Pano`)}
            onClick={() => onPatch({ view: 'kanban' as TasksViewMode })}
          />
        </div>
        {onCreate ? (
          <Button type="button" size="sm" onClick={onCreate}>
            {t`Yeni görev`}
          </Button>
        ) : null}
      </div>
    </div>
  )
}

function ActiveChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex h-[30px] items-center gap-1 rounded-[7px] border border-orchard-500/30 bg-orchard-50 px-2.5 text-[12px] font-medium text-orchard-700">
      <span className="truncate">{label}</span>
      <button
        type="button"
        onClick={onClear}
        className="ml-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded text-fg-muted hover:text-fg"
        aria-label={t`Filtreyi kaldır`}
      >
        <X className="h-3 w-3" strokeWidth={2} />
      </button>
    </span>
  )
}

function PopoverChip({
  label,
  items,
  onSelect,
}: {
  label: string
  items: { id: string; label: string }[]
  onSelect: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useOnClickOutside(ref, () => setOpen(false))

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-[30px] items-center gap-1 rounded-[7px] border border-border bg-surface-0 px-2.5 text-[12px] font-medium text-fg-secondary hover:border-border-strong hover:text-fg"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {label}
        <span className="text-fg-faint" aria-hidden>▾</span>
      </button>
      {open && (
        <div
          className="absolute left-0 z-50 mt-1 max-h-64 w-48 overflow-y-auto rounded-lg border border-border-strong bg-surface-0 py-1 ring-[3px] ring-[rgba(12,18,16,0.04)]"
          role="listbox"
        >
          {items.length === 0 ? (
            <p className="px-3 py-2 text-[12px] text-fg-muted">{i18n._(msg`Seçenek yok`)}</p>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                type="button"
                role="option"
                aria-selected={false}
                className="flex w-full items-center px-3 py-1.5 text-left text-[13px] text-fg hover:bg-surface-1"
                onClick={() => {
                  onSelect(item.id)
                  setOpen(false)
                }}
              >
                {item.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function DateChip({ onApply }: { onApply: (from: string, to: string) => void }) {
  const [open, setOpen] = useState(false)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  useOnClickOutside(ref, () => setOpen(false))

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-[30px] items-center gap-1 rounded-[7px] border border-border bg-surface-0 px-2.5 text-[12px] font-medium text-fg-secondary hover:border-border-strong hover:text-fg"
        aria-expanded={open}
      >
        {i18n._(msg`Tarih`)}
        <span className="text-fg-faint" aria-hidden>▾</span>
      </button>
      {open && (
        <div className="absolute left-0 z-50 mt-1 w-56 rounded-lg border border-border-strong bg-surface-0 p-3 ring-[3px] ring-[rgba(12,18,16,0.04)]">
          <label className="mb-2 flex flex-col gap-1 text-[11px] font-medium text-fg-muted">
            {i18n._(msg`Başlangıç`)}
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="h-8 rounded-md border border-border bg-surface-1 px-2 text-[13px] text-fg"
            />
          </label>
          <label className="mb-3 flex flex-col gap-1 text-[11px] font-medium text-fg-muted">
            {i18n._(msg`Bitiş`)}
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-8 rounded-md border border-border bg-surface-1 px-2 text-[13px] text-fg"
            />
          </label>
          <Button
            type="button"
            size="sm"
            className="w-full"
            onClick={() => {
              onApply(from, to)
              setOpen(false)
            }}
          >
            {i18n._(msg`Uygula`)}
          </Button>
        </div>
      )}
    </div>
  )
}

function ViewIconButton({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-[30px] w-[30px] items-center justify-center rounded-[7px] transition-colors',
        active
          ? 'bg-orchard-50 text-orchard-700 border border-orchard-500/30'
          : 'border border-border bg-surface-0 text-fg-secondary hover:border-border-strong hover:text-fg',
      )}
      aria-pressed={active}
      aria-label={label}
    >
      {icon}
    </button>
  )
}
