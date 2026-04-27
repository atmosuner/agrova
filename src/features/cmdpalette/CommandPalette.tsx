/* eslint-disable lingui/no-unlocalized-strings -- Tailwind classes, query keys */
import { msg } from '@lingui/macro'
import { useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MapPinned, ListTodo, Search, Users } from 'lucide-react'
import { i18n } from '@/lib/i18n'
import { useFieldsQuery, type FieldRow } from '@/features/tasks/useFieldsQuery'
import { useAssignablePeopleQuery } from '@/features/tasks/useAssignablePeopleQuery'
import type { LucideIcon } from 'lucide-react'

type ResultItem = {
  id: string
  label: string
  sublabel?: string
  group: string
  icon: LucideIcon
  onSelect: () => void
}

const PAGES: { to: string; label: () => string; icon: LucideIcon }[] = [
  { to: '/today', label: () => i18n._(msg`Bugün`), icon: ListTodo },
  { to: '/fields', label: () => i18n._(msg`Tarlalar`), icon: MapPinned },
  { to: '/tasks', label: () => i18n._(msg`Görevler`), icon: ListTodo },
  { to: '/issues', label: () => i18n._(msg`Sorunlar`), icon: ListTodo },
  { to: '/people', label: () => i18n._(msg`Ekip`), icon: Users },
  { to: '/equipment', label: () => i18n._(msg`Ekipman`), icon: ListTodo },
  { to: '/reports', label: () => i18n._(msg`Raporlar`), icon: ListTodo },
  { to: '/settings', label: () => i18n._(msg`Ayarlar`), icon: ListTodo },
]

function normalize(s: string): string {
  return s.toLocaleLowerCase('tr-TR')
}

function matchScore(text: string, query: string): number {
  const t = normalize(text)
  const q = normalize(query)
  if (t === q) return 3
  if (t.startsWith(q)) return 2
  if (t.includes(q)) return 1
  return 0
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)

  const { data: fields } = useFieldsQuery()
  const { data: people } = useAssignablePeopleQuery()

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    if (open && !el.open) {
      el.showModal()
      inputRef.current?.focus()
    } else if (!open && el.open) {
      el.close()
    }
  }, [open])

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    const handleClose = () => onClose()
    el.addEventListener('close', handleClose)
    return () => el.removeEventListener('close', handleClose)
  }, [onClose])

  useEffect(() => {
    setQuery('')
    setActiveIdx(0)
  }, [open])

  const results = useMemo(() => {
    const items: ResultItem[] = []
    const q = query.trim()

    const pageGroup = i18n._(msg`Sayfalar`)
    for (const p of PAGES) {
      const label = p.label()
      if (!q || matchScore(label, q) > 0) {
        items.push({
          id: `page:${p.to}`,
          label,
          group: pageGroup,
          icon: p.icon,
          onSelect: () => void navigate({ to: p.to }),
        })
      }
    }

    if (fields) {
      const fieldGroup = i18n._(msg`Tarlalar`)
      const matched: (FieldRow & { _s: number })[] = []
      for (const f of fields) {
        const s = q ? Math.max(matchScore(f.name, q), matchScore(f.crop ?? '', q)) : 1
        if (s > 0) matched.push({ ...f, _s: s })
      }
      matched
        .sort((a, b) => b._s - a._s)
        .slice(0, 8)
        .forEach((f) => {
          items.push({
            id: `field:${f.id}`,
            label: f.name,
            sublabel: f.crop ?? undefined,
            group: fieldGroup,
            icon: MapPinned,
            onSelect: () => void navigate({ to: '/fields', search: { selected: f.id } }),
          })
        })
    }

    if (people) {
      const peopleGroup = i18n._(msg`Kişiler`)
      const matched: (typeof people extends (infer R)[] ? R & { _s: number } : never)[] = []
      for (const p of people) {
        const s = q ? matchScore(p.full_name ?? '', q) : 1
        if (s > 0) matched.push({ ...p, _s: s })
      }
      matched
        .sort((a, b) => b._s - a._s)
        .slice(0, 8)
        .forEach((p) => {
          items.push({
            id: `person:${p.id}`,
            label: p.full_name ?? '—',
            sublabel: p.role ?? undefined,
            group: peopleGroup,
            icon: Users,
            onSelect: () => void navigate({ to: '/people' }),
          })
        })
    }

    return items
  }, [query, fields, people, navigate])

  useEffect(() => {
    setActiveIdx(0)
  }, [query])

  const selectItem = useCallback(
    (item: ResultItem) => {
      onClose()
      item.onSelect()
    },
    [onClose],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIdx((i) => (i + 1) % Math.max(results.length, 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIdx((i) => (i - 1 + results.length) % Math.max(results.length, 1))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const item = results[activeIdx]
        if (item) selectItem(item)
      }
    },
    [results, activeIdx, selectItem],
  )

  const groups = useMemo(() => {
    const map = new Map<string, ResultItem[]>()
    for (const item of results) {
      const g = map.get(item.group) ?? []
      g.push(item)
      map.set(item.group, g)
    }
    return map
  }, [results])

  let flatIdx = -1

  return (
    <dialog
      ref={dialogRef}
      className="m-auto w-full max-w-lg rounded-2xl border border-border bg-surface-0 p-0 backdrop:bg-[rgba(12,18,16,0.55)]"
      aria-label={i18n._(msg`Komut paleti`)}
      onKeyDown={handleKeyDown}
    >
      <div className="flex items-center gap-2 border-b border-border px-4">
        <Search className="h-4 w-4 shrink-0 text-fg-muted" strokeWidth={2} aria-hidden />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={i18n._(msg`Sayfa, tarla veya kişi ara…`)}
          className="h-12 flex-1 bg-transparent text-[15px] text-fg outline-none placeholder:text-fg-faint"
          aria-label={i18n._(msg`Arama`)}
          autoComplete="off"
          spellCheck={false}
        />
      </div>
      <div className="max-h-[min(60vh,24rem)] overflow-y-auto py-2">
        {results.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-fg-muted">{i18n._(msg`Sonuç bulunamadı`)}</p>
        ) : (
          Array.from(groups.entries()).map(([groupName, items]) => (
            <div key={groupName}>
              <p className="px-4 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wider text-fg-faint">
                {groupName}
              </p>
              {items.map((item) => {
                flatIdx++
                const isActive = flatIdx === activeIdx
                const Icon = item.icon
                const idx = flatIdx
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`flex w-full items-center gap-2.5 px-4 py-2 text-left text-[13px] transition-colors ${isActive ? 'bg-orchard-50 text-orchard-700' : 'text-fg hover:bg-surface-1'}`}
                    onClick={() => selectItem(item)}
                    onMouseEnter={() => setActiveIdx(idx)}
                    role="option"
                    aria-selected={isActive}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-fg-muted" strokeWidth={1.75} aria-hidden />
                    <span className="flex-1 truncate font-medium">{item.label}</span>
                    {item.sublabel ? (
                      <span className="truncate text-[12px] text-fg-muted">{item.sublabel}</span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          ))
        )}
      </div>
    </dialog>
  )
}
