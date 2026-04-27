import { t } from '@lingui/macro'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ChevronLeft } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { CategoryGrid } from '@/features/issues/CategoryGrid'
import type { IssueCategory } from '@/features/issues/categories'
import { IssueConfirm } from '@/features/issues/IssueConfirm'
import type { VoiceAttachment } from '@/features/issues/VoiceRecorder'
import { VoiceRecorder } from '@/features/issues/VoiceRecorder'
import { submitIssueDraft } from '@/features/issues/submit-issue'
import { useMyPersonQuery } from '@/features/people/useMyPersonQuery'
import { fetchGeolocationOptional } from '@/lib/geolocation'

function parseReportIssueSearch(s: Record<string, unknown>): {
  taskId?: string
  fieldId?: string
} {
  const taskId = typeof s['taskId'] === 'string' ? s['taskId'] : undefined
  const fieldId = typeof s['fieldId'] === 'string' ? s['fieldId'] : undefined
  return { taskId, fieldId }
}

export const Route = createFileRoute('/m/report-issue')({
  validateSearch: (s: Record<string, unknown>) => parseReportIssueSearch(s),
  component: ReportIssuePage,
})

function ReportIssuePage() {
  const { taskId, fieldId } = Route.useSearch()
  const navigate = useNavigate()
  const { data: me } = useMyPersonQuery()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busyCategory, setBusyCategory] = useState<IssueCategory | null>(null)
  const [draft, setDraft] = useState<{ category: IssueCategory; file: File } | null>(null)
  const [voice, setVoice] = useState<VoiceAttachment | null>(null)

  const openCameraForCategory = useCallback((category: IssueCategory) => {
    setBusyCategory(category)
    requestAnimationFrame(() => {
      inputRef.current?.click()
    })
  }, [])

  return (
    <div className="px-4 pb-6 pt-4">
      {taskId ? (
        <Link to="/m/task/$id" params={{ id: taskId }} className="inline-flex items-center gap-1 text-[14px] font-medium text-orchard-500">
          <ChevronLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
          {t`Göreve dön`}
        </Link>
      ) : (
        <Link to="/m/tasks" className="inline-flex items-center gap-1 text-[14px] font-medium text-orchard-500">
          <ChevronLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
          {t`Görevler`}
        </Link>
      )}
      <h1 className="mt-2.5 text-[22px] font-semibold text-fg">{t`Sorun bildir`}</h1>
      <p className="mt-1 text-[15px] text-fg-secondary">
        {taskId ? t`Bu sorun seçili göreve bağlanır.` : t`Kategori seçince kamera açılır`}
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        aria-hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          const cat = busyCategory
          e.target.value = ''
          setBusyCategory(null)
          if (file && cat) {
            setVoice(null)
            setDraft({ category: cat, file })
          }
        }}
      />

      <div className="mt-6">
        {draft && me ? (
          <IssueConfirm
            category={draft.category}
            file={draft.file}
            voiceSlot={<VoiceRecorder value={voice} onChange={setVoice} />}
            onRetake={() => {
              setVoice(null)
              setDraft(null)
            }}
            onSubmit={async (jpeg) => {
              let gpsLat: number | null = null
              let gpsLng: number | null = null
              if (!taskId) {
                const g = await fetchGeolocationOptional()
                if (g) {
                  gpsLat = g.lat
                  gpsLng = g.lng
                }
              }
              await submitIssueDraft({
                category: draft.category,
                photoJpeg: jpeg,
                reporterId: me.id,
                taskId: taskId ?? null,
                fieldId: fieldId ?? null,
                gpsLat,
                gpsLng,
                voiceBlob: voice?.blob ?? null,
                voiceContentType: voice?.mime ?? null,
              })
              setDraft(null)
              setVoice(null)
              void navigate({ to: '/m/tasks' })
            }}
          />
        ) : (
          <CategoryGrid onSelectCategory={openCameraForCategory} disabled={busyCategory !== null || !me} />
        )}
      </div>
    </div>
  )
}
