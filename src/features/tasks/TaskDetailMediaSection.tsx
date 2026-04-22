import type { MessageDescriptor } from '@lingui/core'
import { msg, t } from '@lingui/macro'
import { useEffect, useMemo, useState } from 'react'
import { IssueCategoryIcon } from '@/components/icons/issues/IssueCategoryIcon'
import { signIssueObjectUrl } from '@/features/issues/sign-issue-media'
import type { IssueCategory } from '@/features/issues/categories'
import { useTaskLinkedIssuesQuery } from '@/features/tasks/useTaskLinkedIssuesQuery'
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

type Props = {
  taskId: string
  completionPhotoPath: string | null
}

export function TaskDetailMediaSection({ taskId, completionPhotoPath }: Props) {
  const { data: issues = [] } = useTaskLinkedIssuesQuery(taskId)
  const [completionUrl, setCompletionUrl] = useState<string | null>(null)
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({})
  const [voiceUrls, setVoiceUrls] = useState<Record<string, string>>({})

  const linkedWithPaths = useMemo(
    () => issues.filter((i) => i.photo_url || i.voice_note_url),
    [issues],
  )

  const hasAnyIssueMedia = linkedWithPaths.length > 0

  const showSection = Boolean(completionPhotoPath?.trim() || hasAnyIssueMedia)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const comp = await signIssueObjectUrl(completionPhotoPath)
      if (cancelled) {
        return
      }
      setCompletionUrl(comp)
    })()
    return () => {
      cancelled = true
    }
  }, [completionPhotoPath])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const thumbs: Record<string, string> = {}
      const voices: Record<string, string> = {}
      for (const r of issues) {
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
        setPhotoUrls(thumbs)
        setVoiceUrls(voices)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [issues])

  if (!showSection) {
    return null
  }

  return (
    <div className="space-y-3 border-t border-border pt-3">
      <p className="text-xs font-semibold text-fg-secondary">{t`Foto ve ses`}</p>

      {completionPhotoPath?.trim() && !completionUrl ? (
        <p className="text-xs text-fg-muted">{t`Tamamlanma görüntüsü yükleniyor…`}</p>
      ) : null}
      {completionUrl ? (
        <figure>
          <figcaption className="mb-1 text-xs text-fg-secondary">{t`Tamamlanma görüntüsü`}</figcaption>
          <a href={completionUrl} target="_blank" rel="noreferrer" className="block">
            <img
              src={completionUrl}
              alt=""
              className={cn('max-h-56 w-full rounded-md border border-border object-contain', 'bg-surface-1')}
            />
          </a>
        </figure>
      ) : null}

      {hasAnyIssueMedia ? (
        <div className="space-y-3">
          <p className="text-xs text-fg-secondary">{t`Göreve bağlı sorunlar`}</p>
          <ul className="space-y-3">
            {linkedWithPaths.map((r) => {
              const pUrl = r.photo_url ? photoUrls[r.id] : null
              const vUrl = r.voice_note_url ? voiceUrls[r.id] : null
              return (
                <li key={r.id} className="rounded-md border border-border bg-surface-1 p-2">
                  <div className="mb-1 flex items-center gap-2 text-xs text-fg">
                    <IssueCategoryIcon category={r.category} className="h-5 w-5 shrink-0" />
                    <span className="font-medium">{i18n._(CATEGORY_LABEL[r.category])}</span>
                    {r.reporter?.full_name ? (
                      <span className="text-fg-secondary">· {r.reporter.full_name}</span>
                    ) : null}
                    {r.resolved_at ? (
                      <span className="ml-auto text-orchard-600">{t`Çözüldü`}</span>
                    ) : null}
                  </div>
                  {r.photo_url && !pUrl ? (
                    <p className="text-xs text-fg-muted">{t`Foto yükleniyor…`}</p>
                  ) : null}
                  {pUrl ? (
                    <a href={pUrl} target="_blank" rel="noreferrer" className="mt-1 block">
                      <img
                        src={pUrl}
                        alt=""
                        className="max-h-48 w-full rounded border border-border object-contain"
                      />
                    </a>
                  ) : null}
                  {r.voice_note_url && !vUrl ? (
                    <p className="mt-1 text-xs text-fg-muted">{t`Ses yükleniyor…`}</p>
                  ) : null}
                  {vUrl ? (
                    <audio controls className="mt-2 w-full" src={vUrl} preload="metadata" aria-label={i18n._(msg`Ses notu`)} />
                  ) : null}
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
