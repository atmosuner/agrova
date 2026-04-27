/* eslint-disable lingui/no-unlocalized-strings -- filter/option value tokens, CVA variants, em dash placeholder; user copy uses t` and msg` */
import type { MessageDescriptor } from '@lingui/core'
import { msg, t } from '@lingui/macro'
import { format } from 'date-fns'
import { tr as dateFnsTr } from 'date-fns/locale'
import { useEffect, useMemo, useRef, useState } from 'react'
import { IssueCategoryIcon } from '@/components/icons/issues/IssueCategoryIcon'
import { Button } from '@/components/ui/button'
import { ISSUE_CATEGORY_ORDER, type IssueCategory } from '@/features/issues/categories'
import { signIssueObjectUrl } from '@/features/issues/sign-issue-media'
import type { IssueListRow } from '@/features/issues/useIssuesQuery'
import { i18n } from '@/lib/i18n'
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
    return rows.filter((r) => {
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
  }, [rows, category, fieldId, resolved])

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
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <FilterTab active={resolved === 'open'} onClick={() => setResolved('open')} label={t`Açık`} />
        <FilterTab active={resolved === 'all'} onClick={() => setResolved('all')} label={t`Tümü`} />
        <FilterTab active={resolved === 'resolved'} onClick={() => setResolved('resolved')} label={t`Çözüldü`} />

        <div className="mx-1 h-5 w-px bg-border-strong" aria-hidden />

        <select
          className="h-[30px] rounded-[7px] border border-border bg-surface-0 px-2.5 text-[12px] font-medium text-fg-secondary"
          value={category}
          onChange={(e) => setCategory(e.target.value as IssueCategory | 'all')}
          aria-label={t`Kategori filtresi`}
        >
          <option value="all">{t`Tüm kategoriler`}</option>
          {ISSUE_CATEGORY_ORDER.map((c) => (
            <option key={c} value={c}>
              {i18n._(CATEGORY_LABEL[c])}
            </option>
          ))}
        </select>

        {fieldOptions.length > 1 && (
          <select
            className="h-[30px] rounded-[7px] border border-border bg-surface-0 px-2.5 text-[12px] font-medium text-fg-secondary"
            value={fieldId}
            onChange={(e) => setFieldId(e.target.value as string | 'all')}
            aria-label={t`Tarla filtresi`}
          >
            <option value="all">{t`Tüm tarlalar`}</option>
            {fieldOptions.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        )}
      </div>

      <ul className="flex flex-col gap-3" aria-live="polite">
        {filtered.map((r) => (
          <li
            key={r.id}
            ref={r.id === highlightId ? highlightRef : undefined}
            className={cn(
              'rounded-xl border border-border bg-surface-0 p-4',
              r.id === highlightId && 'ring-2 ring-orchard-500 ring-offset-2',
            )}
          >
            <div className="flex flex-wrap items-start gap-3">
              <button
                type="button"
                className={cn(
                  'relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-surface-1',
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
                  <div className="flex h-full w-full items-center justify-center text-xs text-fg-muted">
                    {r.photo_url ? t`Yükleniyor…` : t`Foto bekleniyor`}
                  </div>
                )}
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <IssueCategoryIcon category={r.category} className="h-6 w-6 text-orchard-600" />
                  <span className="font-medium text-fg">{i18n._(CATEGORY_LABEL[r.category])}</span>
                  {r.resolved_at ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100">
                      {t`Çözüldü`}
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
                      {t`Açık`}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-fg-secondary">
                  {t`Bildiren`}: {r.reporter?.full_name ?? '—'}
                </p>
                <p className="text-sm text-fg-secondary">
                  {t`Tarla`}: {r.field?.name ?? '—'}
                </p>
                <p className="text-xs text-fg-muted">{format(new Date(r.created_at), 'PPp', { locale: dateFnsTr })}</p>
                {voiceUrls[r.id] ? (
                  <audio src={voiceUrls[r.id]} controls className="mt-2 w-full max-w-sm" />
                ) : null}
              </div>
            </div>
            {onResolve && !r.resolved_at ? (
              <Button
                type="button"
                variant="secondary"
                className="mt-3"
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
                {resolvingId === r.id ? t`Kaydediliyor…` : t`Çözüldü olarak işaretle`}
              </Button>
            ) : null}
          </li>
        ))}
      </ul>

      {filtered.length === 0 ? <p className="text-sm text-fg-secondary">{t`Gösterilecek sorun yok.`}</p> : null}

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

function FilterTab({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-[30px] rounded-[7px] px-3 text-[12px] font-medium transition-colors',
        active
          ? 'border border-border-strong bg-surface-1 text-fg'
          : 'border border-transparent text-fg-secondary hover:text-fg',
      )}
      aria-pressed={active}
    >
      {label}
    </button>
  )
}
