import type { MessageDescriptor } from '@lingui/core'
import { msg, t } from '@lingui/macro'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { IssueCategoryIcon } from '@/components/icons/issues/IssueCategoryIcon'
import type { IssueCategory } from '@/features/issues/categories'
import { WorkerButton } from '@/components/ui/WorkerButton'
import { Button } from '@/components/ui/button'
import { compressImageToJpeg } from '@/lib/image-compress'
import { i18n } from '@/lib/i18n'

const LABEL: Record<IssueCategory, MessageDescriptor> = {
  PEST: msg`Zararlı / hastalık`,
  EQUIPMENT: msg`Bozuk alet`,
  INJURY: msg`Yaralanma`,
  IRRIGATION: msg`Sulama sorunu`,
  WEATHER: msg`Hava hasarı`,
  THEFT: msg`Hırsızlık`,
  SUPPLY: msg`Eksik malzeme`,
}

type Props = {
  category: IssueCategory
  file: File
  onRetake: () => void
  onSubmit: (jpegBlob: Blob) => Promise<void>
  /** M4-04: optional voice slot rendered below actions */
  voiceSlot?: ReactNode
}

export function IssueConfirm({ category, file, onRetake, onSubmit, voiceSlot }: Props) {
  const previewUrl = useMemo(() => URL.createObjectURL(file), [file])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    return () => URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-0 p-3">
        <IssueCategoryIcon category={category} className="h-12 w-12 text-orchard-600" />
        <div>
          <p className="text-xs text-fg-muted">{t`Kategori`}</p>
          <p className="font-medium text-fg">{i18n._(LABEL[category])}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface-1">
        <img src={previewUrl} alt={t`Fotoğraf önizlemesi`} className="max-h-80 w-full object-contain" />
      </div>

      {err ? <p className="text-sm text-harvest-600">{err}</p> : null}

      {voiceSlot}

      <div className="flex flex-col gap-2">
        <WorkerButton
          disabled={busy}
          onClick={async () => {
            setErr(null)
            setBusy(true)
            try {
              const jpeg = await compressImageToJpeg(file)
              try {
                await onSubmit(jpeg)
              } catch {
                setErr(t`Gönderilemedi. Bağlantınızı kontrol edip yeniden deneyin.`)
              }
            } catch {
              setErr(t`Fotoğraf işlenemedi. Yeniden çekmeyi deneyin.`)
            } finally {
              setBusy(false)
            }
          }}
        >
          {busy ? t`Gönderiliyor…` : t`Gönder`}
        </WorkerButton>
        {/* eslint-disable-next-line lingui/no-unlocalized-strings -- CVA variant token, not user copy */}
        <Button type="button" variant="secondary" className="h-12 w-full rounded-full" disabled={busy} onClick={onRetake}>
          {t`Yeniden çek`}
        </Button>
      </div>
    </div>
  )
}
