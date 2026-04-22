/* eslint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/macro'
import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Camera, Check } from 'lucide-react'
import { WorkerButton } from '@/components/ui/WorkerButton'
import { queueTaskCompletionWithOptionalPhoto } from '@/features/tasks/worker-mutations'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/db'

type TaskStatus = Database['public']['Enums']['task_status']

type Step = 'photo' | 'confirm' | 'done'

type Props = {
  taskId: string
  fromStatus: TaskStatus
  onClose: () => void
}

export function CompletionFlow({ taskId, fromStatus, onClose }: Props) {
  const [step, setStep] = useState<Step>('photo')
  const [file, setFile] = useState<File | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [prefersReduce] = useState(
    () => globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  async function onConfirm() {
    setErr(null)
    setBusy(true)
    try {
      await queueTaskCompletionWithOptionalPhoto({ taskId, fromStatus, file: file ?? undefined })
      setStep('done')
      if (!prefersReduce) {
        await new Promise((r) => setTimeout(r, 300))
      }
      await queryClient.invalidateQueries({ queryKey: ['my-today-tasks'] })
      await queryClient.invalidateQueries({ queryKey: ['task', taskId] })
      await queryClient.invalidateQueries({ queryKey: ['my-task-history'] })
      onClose()
      void navigate({ to: '/m/tasks', replace: true })
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  if (step === 'done') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8" aria-hidden>
        <div
          className={cn(
            'flex h-20 w-20 items-center justify-center rounded-full bg-orchard-100 text-orchard-600',
            !prefersReduce && 'animate-pulse',
          )}
        >
          <Check className="h-10 w-10" />
        </div>
      </div>
    )
  }

  if (step === 'photo') {
    return (
      <div className="flex flex-col gap-4 px-4 py-2">
        <h2 className="text-center text-lg font-medium text-fg">{t`Fotoğraf eklensin mi?`}</h2>
        <p className="text-center text-sm text-fg-secondary">{t`İsteğe bağlı — görevi bitirmeden önce sahadan kare alabilirsiniz.`}</p>
        <label className="flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-orchard-300 bg-orchard-50/50 py-3 text-orchard-800 dark:border-orchard-800 dark:bg-orchard-500/5 dark:text-orchard-200">
          <Camera className="h-6 w-6" />
          <span>{t`Foto seç veya çek`}</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null
              setFile(f)
              setStep('confirm')
            }}
          />
        </label>
        {file ? (
          <p className="text-center text-sm text-fg-secondary">{file.name}</p>
        ) : null}
        <div className="flex gap-2">
          <Button type="button" className="flex-1" variant="secondary" onClick={() => setStep('confirm')}>
            {t`Foto yok, devam`}
          </Button>
        </div>
        <Button type="button" variant="ghost" onClick={onClose}>
          {t`Vazgeç`}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-2">
      <h2 className="text-center text-lg font-medium text-fg">{t`Görevi bitirmek üzeresiniz`}</h2>
      <p className="text-center text-sm text-fg-secondary">
        {t`Onayladığınızda görev tamamlanır ve çevrimiçiyseniz sunucuya eşitlenir.`}
      </p>
      {err ? <p className="text-center text-sm text-harvest-500">{err}</p> : null}
      <WorkerButton onClick={onConfirm} disabled={busy}>
        {busy ? t`Kaydediliyor…` : t`Evet, bitir`}
      </WorkerButton>
      <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
        {t`İptal`}
      </Button>
    </div>
  )
}
