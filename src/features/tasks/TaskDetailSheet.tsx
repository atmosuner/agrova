/* eslint-disable lingui/no-unlocalized-strings -- layout utility classes */
import { msg, t } from '@lingui/macro'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useId, useState } from 'react'
import { ActivityIcon } from '@/components/icons/activities/ActivityIcon'
import { Button } from '@/components/ui/button'
import { activityIdFromDbValue } from '@/features/tasks/activities'
import { duplicateTaskForTomorrow, duplicateTaskToFields } from '@/features/tasks/duplicate-task'
import { fieldMatchesQuery } from '@/features/tasks/field-filter'
import { reassignTask } from '@/features/tasks/reassign-task'
import { TaskDetailMediaSection } from '@/features/tasks/TaskDetailMediaSection'
import { useTaskActivityLogQuery } from '@/features/tasks/useTaskActivityLogQuery'
import { useTaskDetailQuery } from '@/features/tasks/useTaskDetailQuery'
import { useAssignablePeopleQuery } from '@/features/tasks/useAssignablePeopleQuery'
import { useFieldsQuery } from '@/features/tasks/useFieldsQuery'
import { i18n } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import type { Enums } from '@/types/db'

type Props = {
  taskId: string | null
  onClose: () => void
}

function statusLabel(s: Enums<'task_status'>): string {
  const m = {
    TODO: msg`Yapılacak`,
    IN_PROGRESS: msg`Sürüyor`,
    DONE: msg`Bitti`,
    BLOCKED: msg`Bloke`,
    CANCELLED: msg`İptal`,
  } as const
  return i18n._(m[s])
}

function actionLabel(action: string): string {
  const map: Record<string, ReturnType<typeof msg>> = {
    'task.created': msg`Görev oluşturuldu`,
    'task.reassigned': msg`Aktarıldı`,
    'task.duplicated': msg`Kopyalandı`,
    'task.started': msg`Başlatıldı`,
    'task.done': msg`Tamamlandı`,
    'task.blocked': msg`Bloke edildi`,
  }
  const m = map[action]
  return m ? i18n._(m) : action
}

export function TaskDetailSheet({ taskId, onClose }: Props) {
  const qc = useQueryClient()
  const { data: task, isLoading, error, refetch } = useTaskDetailQuery(taskId)
  const { data: logRows = [] } = useTaskActivityLogQuery(taskId)
  const { data: people = [] } = useAssignablePeopleQuery()
  const { data: fields = [] } = useFieldsQuery()
  const titleId = useId()
  const [newAssignee, setNewAssignee] = useState<string>('')
  const [busy, setBusy] = useState(false)
  const [formErr, setFormErr] = useState<string | null>(null)
  const [fieldDlg, setFieldDlg] = useState(false)
  const [fieldSearch, setFieldSearch] = useState('')
  const [fieldPick, setFieldPick] = useState<string[]>([])

  const onInvalidated = useCallback(async () => {
    await refetch()
    void qc.invalidateQueries({ queryKey: ['tasks'] })
    void qc.invalidateQueries({ queryKey: ['task', taskId, 'activity_log'] })
    void qc.invalidateQueries({ queryKey: ['task', taskId, 'linked_issues'] })
  }, [qc, refetch, taskId])

  async function onReassign() {
    if (!taskId || !task) {
      return
    }
    if (!newAssignee) {
      setFormErr(i18n._(msg`Bir kişi seçin.`))
      return
    }
    setFormErr(null)
    setBusy(true)
    try {
      await reassignTask(supabase, {
        taskId,
        newAssigneeId: newAssignee,
      })
      setNewAssignee('')
      await onInvalidated()
    } catch (e) {
      setFormErr(e instanceof Error ? e.message : i18n._(msg`Aktarma başarısız.`))
    } finally {
      setBusy(false)
    }
  }

  async function onDupTomorrow() {
    if (!task) {
      return
    }
    setFormErr(null)
    setBusy(true)
    try {
      const { data: me, error: e1 } = await supabase.rpc('current_person_id')
      if (e1) {
        throw e1
      }
      if (!me) {
        throw new Error('me')
      }
      await duplicateTaskForTomorrow(supabase, { task, actorId: me })
      await onInvalidated()
    } catch (e) {
      setFormErr(e instanceof Error ? e.message : i18n._(msg`Kopyalama başarısız.`))
    } finally {
      setBusy(false)
    }
  }

  function toggleField(id: string) {
    setFieldPick((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  }

  async function onDupFields() {
    if (!task) {
      return
    }
    if (fieldPick.length === 0) {
      setFormErr(i18n._(msg`En az bir tarla seçin.`))
      return
    }
    setFormErr(null)
    setBusy(true)
    try {
      const { data: me, error: e1 } = await supabase.rpc('current_person_id')
      if (e1) {
        throw e1
      }
      if (!me) {
        throw new Error('me')
      }
      await duplicateTaskToFields(supabase, { task, fieldIds: fieldPick, actorId: me })
      setFieldDlg(false)
      setFieldPick([])
      await onInvalidated()
    } catch (e) {
      setFormErr(e instanceof Error ? e.message : i18n._(msg`Kopyalama başarısız.`))
    } finally {
      setBusy(false)
    }
  }

  if (!taskId) {
    return null
  }

  const aid = task ? activityIdFromDbValue(task.activity) : null
  const filteredFields = fields.filter((f) => fieldMatchesQuery(f.name, f.crop, fieldSearch))

  return (
    <div
      className="fixed inset-y-0 right-0 z-40 flex w-[min(100vw,440px)] flex-col border-l border-border bg-surface-0"
      role="dialog"
      aria-labelledby={titleId}
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 id={titleId} className="text-lg font-semibold text-fg">
          {t`Görev detayı`}
        </h2>
        <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={busy}>
          {t`Kapat`}
        </Button>
      </div>
      {isLoading ? (
        <p className="p-4 text-sm text-fg-secondary">{t`Yükleniyor…`}</p>
      ) : null}
      {error ? (
        <p className="p-4 text-sm text-red-600 dark:text-red-400">
          {error instanceof Error ? error.message : t`Görev yüklenemedi.`}
        </p>
      ) : null}
      {task && !isLoading && !error ? (
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 text-sm">
          {formErr ? <p className="text-sm text-red-600 dark:text-red-400">{formErr}</p> : null}
          <div className="flex items-start gap-2">
            {aid ? <ActivityIcon id={aid} className="h-10 w-10" /> : null}
            <div>
              <p className="font-semibold text-fg">{task.activity}</p>
              <p className="text-fg-secondary">
                {t`Tarla`}: {task.fields?.name ?? '—'}
              </p>
            </div>
          </div>
          <p>
            <span className="text-fg-secondary">{t`Kime`}:</span> {task.assignee?.full_name ?? '—'}
          </p>
          <p>
            <span className="text-fg-secondary">{t`Durum`}:</span> {statusLabel(task.status)}
          </p>
          <p>
            <span className="text-fg-secondary">{t`Tarih`}:</span> {task.due_date}
          </p>
          {task.notes ? (
            <p>
              <span className="text-fg-secondary">{t`Not`}:</span> {task.notes}
            </p>
          ) : null}

          <TaskDetailMediaSection taskId={task.id} completionPhotoPath={task.completion_photo_url} />

          <div className="space-y-2 border-t border-border pt-3">
            <p className="text-xs font-semibold text-fg-secondary">{t`Aktar`}</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                className="min-w-0 flex-1 rounded-md border border-border bg-surface-1 px-2 py-1.5 text-fg"
                value={newAssignee}
                onChange={(e) => setNewAssignee(e.target.value)}
              >
                <option value="">{i18n._(msg`Yeni sorumlu…`)}</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name}
                  </option>
                ))}
              </select>
              <Button type="button" size="sm" onClick={() => void onReassign()} disabled={busy || !newAssignee}>
                {t`Aktar`}
              </Button>
            </div>
          </div>

          <div className="space-y-2 border-t border-border pt-3">
            <p className="text-xs font-semibold text-fg-secondary">{t`Kopyala`}</p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => void onDupTomorrow()} disabled={busy}>
                {t`Yarın için kopyala`}
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setFieldDlg(true)} disabled={busy}>
                {t`Tarlalara kopyala…`}
              </Button>
            </div>
          </div>

          <div className="space-y-2 border-t border-border pt-3">
            <p className="text-xs font-semibold text-fg-secondary">{t`Zaman çizelgesi`}</p>
            <ul className="space-y-2">
              {logRows.length === 0 ? (
                <li className="text-fg-muted">{t`Henüz kayıt yok.`}</li>
              ) : (
                logRows.map((r) => (
                  <li key={r.id} className="rounded-md border border-border bg-surface-1 px-2 py-1.5 text-xs">
                    <div className="font-medium text-fg">{actionLabel(r.action)}</div>
                    <div className="text-fg-secondary">
                      {r.actor?.full_name ?? '—'} · {new Date(r.created_at).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })}
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      ) : null}

      {fieldDlg ? (
        <dialog
          open
          className="fixed inset-0 z-50 m-auto w-[min(100vw-2rem,400px)] rounded-2xl border border-border bg-surface-0 p-0 backdrop:bg-[rgba(12,18,16,0.55)]"
        >
          <div className="p-3">
            <p className="mb-2 font-medium text-fg">{t`Kopyalanacak tarlalar`}</p>
            <input
              type="search"
              className="mb-2 w-full rounded-md border border-border px-2 py-1 text-sm"
              value={fieldSearch}
              onChange={(e) => setFieldSearch(e.target.value)}
            />
            <ul className="max-h-48 overflow-y-auto">
              {filteredFields.map((f) => (
                <li key={f.id} className="list-none">
                  <label className="flex cursor-pointer items-center gap-2 py-1 text-sm">
                    <input
                      type="checkbox"
                      checked={fieldPick.includes(f.id)}
                      onChange={() => toggleField(f.id)}
                    />
                    {f.name} ({f.crop})
                  </label>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setFieldDlg(false)}>
                {t`Vazgeç`}
              </Button>
              <Button type="button" size="sm" onClick={() => void onDupFields()} disabled={busy}>
                {t`Oluştur`}
              </Button>
            </div>
          </div>
        </dialog>
      ) : null}
    </div>
  )
}
