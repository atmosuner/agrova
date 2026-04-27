/* eslint-disable lingui/no-unlocalized-strings -- layout Tailwind on native dialog */
import { msg, t } from '@lingui/macro'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { ActivityIcon } from '@/components/icons/activities/ActivityIcon'
import { Button } from '@/components/ui/button'
import {
  ACTIVITY_IDS,
  ACTIVITY_LABEL,
  activityDbValue,
  type ActivityId,
} from '@/features/tasks/activities'
import { createTasksFromFields } from '@/features/tasks/create-tasks'
import { fieldMatchesQuery } from '@/features/tasks/field-filter'
import { createTaskStep3Schema } from '@/features/tasks/task-form'
import { useAssignablePeopleQuery } from '@/features/tasks/useAssignablePeopleQuery'
import { useFieldsQuery } from '@/features/tasks/useFieldsQuery'
import { i18n } from '@/lib/i18n'
import { istanbulDateString } from '@/lib/istanbul-date'
import { supabase } from '@/lib/supabase'
import type { Enums } from '@/types/db'

type TaskCreateModalProps = {
  open: boolean
  onClose: () => void
  onCreated?: (taskIds: string[]) => void
}

export function TaskCreateModal({ open, onClose, onCreated }: TaskCreateModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [activity, setActivity] = useState<ActivityId | null>(null)
  const [fieldIds, setFieldIds] = useState<string[]>([])
  const [fieldSearch, setFieldSearch] = useState('')
  const [assigneeId, setAssigneeId] = useState<string | null>(null)
  const [dueDate, setDueDate] = useState(() => istanbulDateString())
  const [priority, setPriority] = useState<Enums<'task_priority'>>('NORMAL')
  const [notes, setNotes] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { data: fields = [], isLoading: fieldsLoading, error: fieldsError } = useFieldsQuery()
  const { data: crew = [], isLoading: peopleLoading, error: peopleError } = useAssignablePeopleQuery()

  const filteredFields = useMemo(() => {
    return fields.filter((f) => fieldMatchesQuery(f.name, f.crop, fieldSearch))
  }, [fields, fieldSearch])

  const fieldNameById = useMemo(() => {
    const m = new Map<string, string>()
    for (const f of fields) {
      m.set(f.id, f.name)
    }
    return m
  }, [fields])

  const roleShort = (r: Enums<'person_role'>) => {
    const k = {
      FOREMAN: msg`Ekipbaşı`,
      AGRONOMIST: msg`Ziraat mühendisi`,
      WORKER: msg`İşçi`,
      OWNER: msg`Sahip`,
    } as const
    return i18n._(k[r])
  }

  const isDirty =
    activity !== null || fieldIds.length > 0 || step > 1 || assigneeId !== null || notes.length > 0

  const resetWizard = useCallback(() => {
    setStep(1)
    setActivity(null)
    setFieldIds([])
    setFieldSearch('')
    setAssigneeId(null)
    setDueDate(istanbulDateString())
    setPriority('NORMAL')
    setNotes('')
    setSubmitError(null)
  }, [])

  const tryClose = useCallback(() => {
    if (isDirty) {
      const ok = window.confirm(
        i18n._(msg`Kaydedilmemiş değişiklikler var. Pencereyi kapatılsın mı?`),
      )
      if (!ok) {
        return
      }
    }
    resetWizard()
    onClose()
  }, [isDirty, onClose, resetWizard])

  const onSubmit = useCallback(async () => {
    setSubmitError(null)
    if (!activity || fieldIds.length === 0) {
      return
    }
    const minDay = istanbulDateString()
    if (dueDate < minDay) {
      setSubmitError(i18n._(msg`Bitiş tarihi geçmişte olamaz.`))
      return
    }
    if (!assigneeId) {
      setSubmitError(i18n._(msg`Bir kişi seçin.`))
      return
    }
    const parsed = createTaskStep3Schema.safeParse({
      assigneeId,
      dueDate,
      priority,
      notes: notes.trim(),
    })
    if (!parsed.success) {
      setSubmitError(parsed.error.issues[0]?.message ?? i18n._(msg`Formu kontrol edin.`))
      return
    }
    setSubmitting(true)
    try {
      const ids = await createTasksFromFields(supabase, {
        fieldIds,
        activityText: activityDbValue(activity),
        assigneeId: parsed.data.assigneeId,
        dueDate: parsed.data.dueDate,
        priority: parsed.data.priority,
        notes: parsed.data.notes ? parsed.data.notes : null,
      })
      onCreated?.(ids)
      resetWizard()
      onClose()
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : i18n._(msg`Kayıt başarısız.`))
    } finally {
      setSubmitting(false)
    }
  }, [activity, assigneeId, dueDate, fieldIds, notes, onClose, onCreated, priority, resetWizard])

  function toggleField(id: string) {
    setFieldIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function removeFieldChip(id: string) {
    setFieldIds((prev) => prev.filter((x) => x !== id))
  }

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
      className="fixed inset-0 m-auto w-[min(100vw-2rem,520px)] max-h-[min(100dvh-2rem,720px)] overflow-hidden rounded-2xl border border-border bg-surface-0 p-0 text-fg backdrop:bg-[rgba(12,18,16,0.55)]"
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
          <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 py-3">
            <p className="text-sm text-fg-secondary">{t`2. Tarlaları seçin (birden çok olabilir)`}</p>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-fg-secondary">{t`Ara`}</span>
              <input
                type="search"
                className="rounded-md border border-border bg-surface-1 px-2 py-1.5 text-sm text-fg"
                value={fieldSearch}
                onChange={(e) => setFieldSearch(e.target.value)}
                placeholder={i18n._(msg`Tarla veya ürün…`)}
                autoComplete="off"
              />
            </label>
            {fieldIds.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {fieldIds.map((id) => (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 rounded-full bg-orchard-100 px-2 py-0.5 text-xs text-orchard-900 dark:bg-orchard-900/30 dark:text-orchard-100"
                  >
                    {fieldNameById.get(id) ?? id.slice(0, 8)}
                    <button
                      type="button"
                      className="rounded p-0.5 hover:bg-orchard-200/60 dark:hover:bg-orchard-800/60"
                      onClick={() => removeFieldChip(id)}
                      aria-label={i18n._(msg`Kaldır`)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
            {fieldsLoading ? (
              <p className="text-sm text-fg-secondary">{t`Tarlalar yükleniyor…`}</p>
            ) : null}
            {fieldsError ? (
              <p className="text-sm text-destructive">{fieldsError.message}</p>
            ) : null}
            {!fieldsLoading && !fieldsError ? (
              <ul className="max-h-60 overflow-y-auto rounded-md border border-border bg-surface-1 p-1">
                {filteredFields.length === 0 ? (
                  <li className="list-none px-2 py-3 text-sm text-fg-secondary">{t`Eşleşen tarla yok.`}</li>
                ) : (
                  filteredFields.map((f) => {
                    const on = fieldIds.includes(f.id)
                    return (
                      <li key={f.id} className="list-none">
                        <button
                          type="button"
                          className={
                            on
                              ? 'flex w-full items-center justify-between gap-2 rounded-md bg-orchard-100 px-2 py-2 text-left text-sm text-orchard-900 dark:bg-orchard-900/30 dark:text-orchard-100'
                              : 'flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-sm text-fg hover:bg-surface-2'
                          }
                          onClick={() => toggleField(f.id)}
                        >
                          <span className="font-medium">{f.name}</span>
                          <span className="text-fg-secondary">{f.crop}</span>
                        </button>
                      </li>
                    )
                  })
                )}
              </ul>
            ) : null}
          </div>
        ) : null}
        {step === 3 ? (
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-3">
            <p className="text-sm text-fg-secondary">{t`3. Kişi, son tarih ve not`}</p>
            {submitError ? (
              <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                {submitError}
              </p>
            ) : null}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-fg-secondary">{t`Kime`}</span>
              {peopleLoading ? (
                <p className="text-sm text-fg-secondary">{t`Ekip yükleniyor…`}</p>
              ) : null}
              {peopleError ? (
                <p className="text-sm text-red-600 dark:text-red-400">{peopleError.message}</p>
              ) : null}
              {!peopleLoading && !peopleError ? (
                <select
                  className="rounded-md border border-border bg-surface-1 px-2 py-2 text-sm text-fg"
                  value={assigneeId ?? ''}
                  onChange={(e) => setAssigneeId(e.target.value || null)}
                >
                  <option value="">{i18n._(msg`Seçin…`)}</option>
                  {crew.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} ({roleShort(p.role)})
                    </option>
                  ))}
                </select>
              ) : null}
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-fg-secondary">{t`Bitiş tarihi`}</span>
              <input
                type="date"
                className="rounded-md border border-border bg-surface-1 px-2 py-2 text-sm text-fg"
                min={istanbulDateString()}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-fg-secondary">{t`Öncelik`}</span>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ['LOW', msg`Düşük`],
                    ['NORMAL', msg`Normal`],
                    ['URGENT', msg`Acil`],
                  ] as const
                ).map(([k, m]) => (
                  <Button
                    key={k}
                    type="button"
                    size="sm"
                    variant={priority === k ? 'default' : 'outline'}
                    onClick={() => setPriority(k)}
                  >
                    {i18n._(m)}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-fg-secondary">
                {t`Not`} <span className="text-fg-muted">({notes.length}/500)</span>
              </span>
              <textarea
                className="min-h-24 rounded-md border border-border bg-surface-1 px-2 py-2 text-sm text-fg"
                value={notes}
                maxLength={500}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        ) : null}
        <footer className="mt-auto flex flex-col gap-2 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-h-[1.25rem] text-sm text-orchard-800 dark:text-orchard-200">
            {fieldIds.length > 0
              ? `${fieldIds.length} ${i18n._(msg`görev oluşturulacak`)}`
              : null}
          </div>
          <div className="flex justify-end gap-2">
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
                disabled={(step === 1 && !activity) || (step === 2 && fieldIds.length === 0)}
                onClick={() => {
                  if (step === 1) {
                    if (activity) {
                      setStep(2)
                    }
                  } else if (step === 2) {
                    if (fieldIds.length > 0) {
                      setStep(3)
                    }
                  }
                }}
              >
                {t`İleri`}
              </Button>
            ) : (
              <Button type="button" disabled={submitting} onClick={() => void onSubmit()}>
                {submitting ? t`Kaydediliyor…` : t`Oluştur`}
              </Button>
            )}
          </div>
        </footer>
      </div>
    </dialog>
  )
}
