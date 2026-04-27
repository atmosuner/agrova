/* eslint-disable lingui/no-unlocalized-strings -- filter/option value tokens, CVA variants, em dash placeholder; user copy uses t` and msg` */
import type { MessageDescriptor } from '@lingui/core'
import { msg, t } from '@lingui/macro'
import { format } from 'date-fns'
import { tr as dateFnsTr } from 'date-fns/locale'
import { ArrowDown, ArrowUp, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { IssueCategoryIcon } from '@/components/icons/issues/IssueCategoryIcon'
import { Button } from '@/components/ui/button'
import { ISSUE_CATEGORY_ORDER, type IssueCategory } from '@/features/issues/categories'
import { signIssueObjectUrl } from '@/features/issues/sign-issue-media'
import type { IssueListRow } from '@/features/issues/useIssuesQuery'
import { i18n } from '@/lib/i18n'
import { useOnClickOutside } from '@/lib/use-on-click-outside'
import { cn } from '@/lib/utils'

const CATEGORY_LABEL: Record<IssueCategory, MessageDescriptor> = {
  PEST: msg`Zararlı / hastalık`,
  EQUIPMENT: msg`Bozuk alet`,
  INJURY: msg`Yaralanma`,
  IRRIGATION: msg`Sulama sorunu`,
  WEATHER: msg`Hava hasarı`,
  THEFT: msg`Hırsızlık`,
  SUPPLY: msg`Eksik malzeme`,
}

type ResolvedFilter = 'all' | 'open' | 'resolved'

type Props = {
  rows: IssueListRow[]
  loading: boolean
  error: Error | null
  onResolve?: (issueId: string) => Promise<void>
  /** Scroll + highlight a row (e.g. deep link from push / bell). */
  highlightId?: string
  /** Initial “Durum” filter (e.g. `?list=open` from dashboard). */
  defaultResolved?: ResolvedFilter
}

export function IssuesFeed({ rows, loading, error, onResolve, highlightId, defaultResolved = 'all' }: Props) {
  const [category, setCategory] = useState<IssueCategory | 'all'>('all')
  const [fieldId, setFieldId] = useState<string | 'all'>('all')
  const [resolved, setResolved] = useState<ResolvedFilter>(defaultResolved)
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({})
  const [voiceUrls, setVoiceUrls] = useState<Record<string, string>>({})
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  type IssueSortCol = 'created_at' | 'category'
  type IssueSortDir = 'asc' | 'desc'
  const [issueSortCol, setIssueSortCol] = useState<IssueSortCol>('created_at')
  const [issueSortDir, setIssueSortDir] = useState<IssueSortDir>('desc')

  const fieldOptions = useMemo(() => {
    const m = new Map<string, string>()
    for (const r of rows) {
      if (r.field_id && r.field?.name) {
        m.set(r.field_id, r.field.name)
      }
    }
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1], 'tr'))
  }, [rows])

  const highlightRef = useRef<HTMLLIElement | null>(null)

  const filtered = useMemo(() => {
    const list = rows.filter((r) => {
      if (category !== 'all' && r.category !== category) {
        return false
      }
      if (fieldId !== 'all' && r.field_id !== fieldId) {
        return false
      }
      if (resolved === 'open' && r.resolved_at) {
        return false
      }
      if (resolved === 'resolved' && !r.resolved_at) {
        return false
      }
      return true
    })
    const dir = issueSortDir === 'asc' ? 1 : -1
    list.sort((a, b) => {
      if (issueSortCol === 'created_at') return a.created_at.localeCompare(b.created_at) * dir
      return a.category.localeCompare(b.category) * dir
    })
    return list
  }, [rows, category, fieldId, resolved, issueSortCol, issueSortDir])

  useEffect(() => {
    if (!highlightId || !highlightRef.current) {
      return
    }
    highlightRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [highlightId, filtered])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const thumbs: Record<string, string> = {}
      const voices: Record<string, string> = {}
      for (const r of filtered) {
        if (r.photo_url) {
          const u = await signIssueObjectUrl(r.photo_url)
          if (u) {
            thumbs[r.id] = u
          }
        }
        if (r.voice_note_url) {
          const u = await signIssueObjectUrl(r.voice_note_url)
          if (u) {
            voices[r.id] = u
          }
        }
      }
      if (!cancelled) {
        setThumbUrls(thumbs)
        setVoiceUrls(voices)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [filtered])

  if (loading) {
    return <p className="text-sm text-fg-secondary">{t`Yükleniyor…`}</p>
  }

  if (error) {
    return <p className="text-sm text-harvest-600">{t`Liste yüklenemedi.`}</p>
  }

  return (
    <div className="space-y-4">
      {/* Filter bar — same ActiveChip / PopoverChip pattern as Tasks */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {resolved !== 'all' && (
          <ActiveChip
            label={`${i18n._(msg`Durum`)}: ${resolved === 'open' ? i18n._(msg`Açık`) : i18n._(msg`Çözüldü`)}`}
            onClear={() => setResolved('all')}
          />
        )}
        {category !== 'all' && (
          <ActiveChip
            label={`${i18n._(msg`Kategori`)}: ${i18n._(CATEGORY_LABEL[category])}`}
            onClear={() => setCategory('all')}
          />
        )}
        {fieldId !== 'all' && (
          <ActiveChip
            label={`${i18n._(msg`Tarla`)}: ${fieldOptions.find(([id]) => id === fieldId)?.[1] ?? fieldId}`}
            onClear={() => setFieldId('all')}
          />
        )}

        {(resolved !== 'all' || category !== 'all' || fieldId !== 'all') && (
          <div className="mx-0.5 h-5 w-px bg-border-strong" aria-hidden />
        )}

        {resolved === 'all' && (
          <PopoverChip
            label={`+ ${i18n._(msg`Durum`)}`}
            items={[
              { id: 'open', label: i18n._(msg`Açık`) },
              { id: 'resolved', label: i18n._(msg`Çözüldü`) },
            ]}
            onSelect={(id) => setResolved(id as ResolvedFilter)}
          />
        )}
        {category === 'all' && (
          <PopoverChip
            label={`+ ${i18n._(msg`Kategori`)}`}
            items={ISSUE_CATEGORY_ORDER.map((c) => ({ id: c, label: i18n._(CATEGORY_LABEL[c]) }))}
            onSelect={(id) => setCategory(id as IssueCategory)}
          />
        )}
        {fieldId === 'all' && fieldOptions.length > 0 && (
          <PopoverChip
            label={`+ ${i18n._(msg`Tarla`)}`}
            items={fieldOptions.map(([id, name]) => ({ id, label: name }))}
            onSelect={(id) => setFieldId(id)}
          />
        )}

        <div className="mx-0.5 h-5 w-px bg-border-strong" aria-hidden />

        <button
          type="button"
          onClick={() => {
            if (issueSortCol === 'created_at' && issueSortDir === 'desc') {
              setIssueSortDir('asc')
            } else if (issueSortCol === 'created_at' && issueSortDir === 'asc') {
              setIssueSortCol('category')
              setIssueSortDir('asc')
            } else {
              setIssueSortCol('created_at')
              setIssueSortDir('desc')
            }
          }}
          className="inline-flex h-[30px] items-center gap-1 rounded-[7px] border border-border bg-surface-0 px-2.5 text-[12px] font-medium text-fg-secondary transition-colors hover:border-border-strong hover:text-fg"
        >
          {issueSortDir === 'desc' ? <ArrowDown className="h-3.5 w-3.5" /> : <ArrowUp className="h-3.5 w-3.5" />}
          {issueSortCol === 'created_at' ? t`Tarihe göre` : t`Kategoriye göre`}
        </button>
      </div>

      {/* Issue cards inside a bordered container */}
      <div className="overflow-hidden rounded-xl border border-border">
        <ul className="divide-y divide-border" aria-live="polite">
          {filtered.map((r) => (
            <li
              key={r.id}
              ref={r.id === highlightId ? highlightRef : undefined}
              className={cn(
                'bg-surface-0 px-5 py-4',
                r.id === highlightId && 'ring-2 ring-inset ring-orchard-500',
              )}
            >
              <div className="flex items-start gap-4">
                <button
                  type="button"
                  className={cn(
                    'relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-surface-1',
                    thumbUrls[r.id] ? 'cursor-zoom-in' : 'cursor-default',
                  )}
                  onClick={() => {
                    if (thumbUrls[r.id]) {
                      setLightbox(thumbUrls[r.id]!)
                    }
                  }}
                  aria-label={t`Fotoğrafı büyüt`}
                >
                  {thumbUrls[r.id] ? (
                    <img src={thumbUrls[r.id]} alt={t`Sorun fotoğrafı`} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] text-fg-muted">
                      {r.photo_url ? t`Yükleniyor…` : t`Foto yok`}
                    </div>
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <IssueCategoryIcon category={r.category} className="h-5 w-5 text-orchard-600" />
                    <span className="text-[13px] font-medium text-fg">{i18n._(CATEGORY_LABEL[r.category])}</span>
                    {r.resolved_at ? (
                      <span className="inline-flex items-center rounded-full bg-status-done/10 px-2 py-0.5 text-[11px] font-medium text-status-done">
                        {t`Çözüldü`}
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-status-blocked/10 px-2 py-0.5 text-[11px] font-medium text-status-blocked">
                        {t`Açık`}
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-[12px] text-fg-secondary">
                    <span>{r.reporter?.full_name ?? '\u2014'}</span>
                    <span>{r.field?.name ?? '\u2014'}</span>
                    <span className="tabular-nums text-fg-muted">
                      {format(new Date(r.created_at), 'd MMM yyyy, HH:mm', { locale: dateFnsTr })}
                    </span>
                  </div>
                  {voiceUrls[r.id] ? (
                    <audio src={voiceUrls[r.id]} controls className="mt-2 h-8 w-full max-w-xs" />
                  ) : null}
                </div>

                {onResolve && !r.resolved_at ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="shrink-0"
                    disabled={resolvingId === r.id}
                    onClick={() => {
                      void (async () => {
                        setResolvingId(r.id)
                        try {
                          await onResolve(r.id)
                        } finally {
                          setResolvingId((cur) => (cur === r.id ? null : cur))
                        }
                      })()
                    }}
                  >
                    {resolvingId === r.id ? t`Kaydediliyor…` : t`Çözüldü`}
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>

        {filtered.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-fg-secondary">{t`Gösterilecek sorun yok.`}</p>
        ) : null}
      </div>

      {lightbox ? (
        <button
          type="button"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
          aria-label={t`Kapat`}
        >
          <img src={lightbox} alt={t`Sorun fotoğrafı büyük`} className="max-h-[90vh] max-w-full object-contain" />
        </button>
      ) : null}
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
