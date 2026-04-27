/* eslint-disable lingui/no-unlocalized-strings -- layout utility classes */
import { msg, t } from '@lingui/macro'
import { format, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'
import { X } from 'lucide-react'
import { useId, useState } from 'react'
import { IssueCategoryIcon } from '@/components/icons/issues/IssueCategoryIcon'
import { Button } from '@/components/ui/button'
import { CATEGORY_LABEL } from '@/features/issues/issue-labels'
import { useSignedUrl } from '@/features/issues/sign-issue-media'
import type { IssueListRow } from '@/features/issues/useIssuesQuery'
import { i18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

type Props = {
  issue: IssueListRow | null
  onClose: () => void
  onResolve?: (issueId: string) => Promise<void>
}

function fmtDatetime(iso: string | null | undefined): string {
  if (!iso) return '\u2014'
  try {
    return format(parseISO(iso), 'd MMM yyyy, HH:mm', { locale: tr })
  } catch {
    return iso
  }
}

function initialsOf(name: string | null | undefined): string {
  if (!name?.trim()) return '\u2014'
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '')).toUpperCase()
}

const AVATAR_COLORS = [
  'bg-orchard-100 text-orchard-700',
  'bg-sky-100 text-sky-700',
  'bg-amber-100 text-amber-700',
  'bg-violet-100 text-violet-700',
  'bg-rose-100 text-rose-700',
  'bg-teal-100 text-teal-700',
] as const

function avatarColor(name: string | null | undefined): string {
  if (!name) return AVATAR_COLORS[0]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length] ?? AVATAR_COLORS[0]
}

export function IssueDetailSheet({ issue, onClose, onResolve }: Props) {
  const titleId = useId()
  const [resolving, setResolving] = useState(false)
  const { data: photoUrl } = useSignedUrl(issue?.photo_url)
  const { data: voiceUrl } = useSignedUrl(issue?.voice_note_url)
  const [lightbox, setLightbox] = useState(false)

  if (!issue) return null

  const categoryLabel = i18n._(CATEGORY_LABEL[issue.category])

  return (
    <>
      <div className="fixed inset-0 z-[1100] bg-[rgba(12,18,16,0.3)]" onClick={onClose} aria-hidden />
      <div
        className="fixed inset-y-0 right-0 z-[1200] flex w-[min(100vw,440px)] flex-col border-l border-border bg-surface-0 shadow-lg"
        role="dialog"
        aria-labelledby={titleId}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-3">
          <h2 id={titleId} className="text-[15px] font-semibold text-fg">
            {t`Sorun detayı`}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface-1 text-fg transition-colors hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-orchard-500"
            aria-label={t`Kapat`}
          >
            <X className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>

        {/* Body */}
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-5 text-sm">
          {/* Photo */}
          {photoUrl ? (
            <button
              type="button"
              className="w-full overflow-hidden rounded-xl bg-surface-1 cursor-zoom-in"
              onClick={() => setLightbox(true)}
              aria-label={t`Fotoğrafı büyüt`}
            >
              <img
                src={photoUrl}
                alt={t`Sorun fotoğrafı`}
                className="h-auto max-h-64 w-full object-cover"
              />
            </button>
          ) : issue.photo_url ? (
            <div className="flex h-40 w-full items-center justify-center rounded-xl bg-surface-1 text-sm text-fg-muted">
              {t`Fotoğraf yükleniyor…`}
            </div>
          ) : null}

          {/* Category + status header */}
          <div className="flex items-start gap-3">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orchard-50">
              <IssueCategoryIcon category={issue.category} className="h-6 w-6 text-orchard-600" />
            </span>
            <div className="min-w-0">
              <p className="text-lg font-semibold text-fg">{categoryLabel}</p>
              <div className="mt-1 flex items-center gap-2">
                {issue.resolved_at ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
                    {t`Çözüldü`}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />
                    {t`Açık`}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-fg-muted">{i18n._(msg`Bildiren`)}</p>
              <span className="mt-1 inline-flex items-center gap-1.5">
                <span className={cn('inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold', avatarColor(issue.reporter?.full_name))}>
                  {initialsOf(issue.reporter?.full_name)}
                </span>
                <span className="text-[13px] font-medium text-fg">{issue.reporter?.full_name ?? '\u2014'}</span>
              </span>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-fg-muted">{i18n._(msg`Tarla`)}</p>
              <p className="mt-1 text-[13px] font-medium text-fg">{issue.field?.name ?? '\u2014'}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-fg-muted">{i18n._(msg`Tarih`)}</p>
              <p className="mt-1 text-[13px] font-medium tabular-nums text-fg">{fmtDatetime(issue.created_at)}</p>
            </div>
            {issue.resolved_at ? (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-fg-muted">{i18n._(msg`Çözülme tarihi`)}</p>
                <p className="mt-1 text-[13px] font-medium tabular-nums text-fg">{fmtDatetime(issue.resolved_at)}</p>
              </div>
            ) : null}
            {issue.resolver?.full_name ? (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-fg-muted">{i18n._(msg`Çözen`)}</p>
                <span className="mt-1 inline-flex items-center gap-1.5">
                  <span className={cn('inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold', avatarColor(issue.resolver.full_name))}>
                    {initialsOf(issue.resolver.full_name)}
                  </span>
                  <span className="text-[13px] font-medium text-fg">{issue.resolver.full_name}</span>
                </span>
              </div>
            ) : null}
          </div>

          {/* Voice note */}
          {voiceUrl ? (
            <div className="space-y-2 border-t border-border pt-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-fg-muted">{i18n._(msg`Sesli not`)}</p>
              <audio src={voiceUrl} controls className="h-10 w-full" />
            </div>
          ) : null}

          {/* Resolve action */}
          {onResolve && !issue.resolved_at ? (
            <div className="border-t border-border pt-4">
              <Button
                type="button"
                className="w-full"
                disabled={resolving}
                onClick={() => {
                  void (async () => {
                    setResolving(true)
                    try {
                      await onResolve(issue.id)
                    } finally {
                      setResolving(false)
                    }
                  })()
                }}
              >
                {resolving ? t`Kaydediliyor…` : t`Çözüldü olarak işaretle`}
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && photoUrl ? (
        <button
          type="button"
          className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(false)}
          aria-label={t`Kapat`}
        >
          <img src={photoUrl} alt={t`Sorun fotoğrafı büyük`} className="max-h-[90vh] max-w-full object-contain" />
        </button>
      ) : null}
    </>
  )
}
