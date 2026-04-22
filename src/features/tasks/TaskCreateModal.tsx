/* eslint-disable lingui/no-unlocalized-strings -- layout Tailwind on native dialog */
import { msg, t } from '@lingui/macro'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { ActivityIcon } from '@/components/icons/activities/ActivityIcon'
import { Button } from '@/components/ui/button'
import {
  ACTIVITY_IDS,
  ACTIVITY_LABEL,
  type ActivityId,
} from '@/features/tasks/activities'
import { i18n } from '@/lib/i18n'

type TaskCreateModalProps = {
  open: boolean
  onClose: () => void
}

export function TaskCreateModal({ open, onClose }: TaskCreateModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [activity, setActivity] = useState<ActivityId | null>(null)

  const isDirty = activity !== null || step > 1

  const tryClose = useCallback(() => {
    if (isDirty) {
      const ok = window.confirm(
        i18n._(msg`Kaydedilmemiş değişiklikler var. Pencereyi kapatılsın mı?`),
      )
      if (!ok) {
        return
      }
    }
    setStep(1)
    setActivity(null)
    onClose()
  }, [isDirty, onClose])

  useEffect(() => {
    const el = dialogRef.current
    if (!el) {
      return
    }
    if (open) {
      if (!el.open) {
        el.showModal()
      }
    } else if (el.open) {
      el.close()
    }
  }, [open])

  const onDialogCancel = useCallback(
    (e: Event) => {
      e.preventDefault()
      tryClose()
    },
    [tryClose],
  )

  useEffect(() => {
    const el = dialogRef.current
    if (!el) {
      return
    }
    el.addEventListener('cancel', onDialogCancel)
    return () => {
      el.removeEventListener('cancel', onDialogCancel)
    }
  }, [onDialogCancel])

  const onBackdropPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.target === dialogRef.current) {
        tryClose()
      }
    },
    [tryClose],
  )

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 m-auto w-[min(100vw-2rem,520px)] max-h-[min(100dvh-2rem,720px)] overflow-hidden rounded-lg border border-border bg-surface-0 p-0 text-fg shadow-lg backdrop:bg-black/40"
      onPointerDown={onBackdropPointerDown}
    >
      <div className="flex max-h-[min(100dvh-2rem,720px)] flex-col">
        <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
          <h2 id={titleId} className="text-lg font-semibold tracking-tight text-fg">
            {t`Yeni görev`}
          </h2>
          <button
            type="button"
            className="rounded-md px-2 py-1 text-sm text-fg-secondary hover:bg-surface-1 hover:text-fg"
            onClick={() => tryClose()}
          >
            {t`Kapat`}
          </button>
        </header>
        {step === 1 ? (
          <div className="flex-1 overflow-y-auto px-4 py-3">
            <p className="mb-3 text-sm text-fg-secondary">{t`1. Aktivite seçin`}</p>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="listbox" aria-label={i18n._(msg`Aktiviteler`)}>
              {ACTIVITY_IDS.map((id) => {
                const selected = activity === id
                return (
                  <li key={id} className="list-none">
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      className={
                        selected
                          ? 'flex w-full flex-col items-center gap-1.5 rounded-lg border-2 border-orchard-500 bg-orchard-50 p-2 text-center dark:bg-surface-2'
                          : 'flex w-full flex-col items-center gap-1.5 rounded-lg border border-border bg-surface-1 p-2 text-center hover:border-orchard-300'
                      }
                      onClick={() => setActivity(id)}
                    >
                      <ActivityIcon id={id} className="text-orchard-600" aria-hidden />
                      <span className="text-xs font-medium text-fg">{i18n._(ACTIVITY_LABEL[id])}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ) : null}
        {step === 2 ? (
          <div className="flex-1 overflow-y-auto px-4 py-6 text-center text-sm text-fg-secondary">
            {t`Tarlalar yükleniyor…`}
          </div>
        ) : null}
        {step === 3 ? (
          <div className="flex-1 overflow-y-auto px-4 py-6 text-center text-sm text-fg-secondary">
            {t`Atama ve tarih (son adım)…`}
          </div>
        ) : null}
        <footer className="mt-auto flex justify-end gap-2 border-t border-border px-4 py-3">
          {step > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (step === 2) {
                  setStep(1)
                } else {
                  setStep(2)
                }
              }}
            >
              {t`Geri`}
            </Button>
          ) : null}
          {step < 3 ? (
            <Button
              type="button"
              disabled={step === 1 && !activity}
              onClick={() => {
                if (step === 1) {
                  if (activity) {
                    setStep(2)
                  }
                } else if (step === 2) {
                  setStep(3)
                }
              }}
            >
              {t`İleri`}
            </Button>
          ) : null}
        </footer>
      </div>
    </dialog>
  )
}
