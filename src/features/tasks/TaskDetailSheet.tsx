/* eslint-disable lingui/no-unlocalized-strings -- layout utility classes */
import { msg, t } from '@lingui/macro'
import { useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'
import { X } from 'lucide-react'
import { useCallback, useId, useState } from 'react'
import { ActivityIcon } from '@/components/icons/activities/ActivityIcon'
import { Button } from '@/components/ui/button'
import { activityIdFromDbValue, ACTIVITY_LABEL } from '@/features/tasks/activities'
import { duplicateTaskForTomorrow, duplicateTaskToFields } from '@/features/tasks/duplicate-task'
import { fieldMatchesQuery } from '@/features/tasks/field-filter'
import { reassignTask } from '@/features/tasks/reassign-task'
import { TaskDetailMediaSection } from '@/features/tasks/TaskDetailMediaSection'
import { useTaskActivityLogQuery } from '@/features/tasks/useTaskActivityLogQuery'
import { useTaskDetailQuery } from '@/features/tasks/useTaskDetailQuery'
import { useAssignablePeopleQuery } from '@/features/tasks/useAssignablePeopleQuery'
import { useFieldsQuery } from '@/features/tasks/useFieldsQuery'
import { i18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'
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

const STATUS_DOT: Record<Enums<'task_status'>, string> = {
  TODO: 'bg-sky-500',
  IN_PROGRESS: 'bg-emerald-500',
  DONE: 'bg-surface-2',
  BLOCKED: 'bg-amber-500',
  CANCELLED: 'bg-surface-2',
}

const STATUS_CHIP: Record<Enums<'task_status'>, string> = {
  TODO: 'bg-sky-50 text-sky-700 border-sky-200',
  IN_PROGRESS: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  DONE: 'bg-surface-1 text-fg-muted border-border',
  BLOCKED: 'bg-amber-50 text-amber-700 border-amber-200',
  CANCELLED: 'bg-surface-1 text-fg-muted border-border',
}

const LOG_DOT: Record<string, string> = {
  'task.created': 'bg-emerald-500',
  'task.reassigned': 'bg-sky-500',
  'task.duplicated': 'bg-violet-500',
  'task.started': 'bg-orchard-500',
  'task.done': 'bg-emerald-500',
  'task.blocked': 'bg-amber-500',
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

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '\u2014'
  try {
    return format(parseISO(iso), 'd MMM yyyy', { locale: tr })
  } catch {
    return iso
  }
}

function fmtDatetime(iso: string): string {
  try {
    return format(parseISO(iso), 'd MMM, HH:mm', { locale: tr })
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
    if (!taskId || !task) return
    if (!newAssignee) {
      setFormErr(i18n._(msg`Bir kişi seçin.`))
      return
    }
    setFormErr(null)
    setBusy(true)
    try {
      await reassignTask(supabase, { taskId, newAssigneeId: newAssignee })
      setNewAssignee('')
      await onInvalidated()
    } catch (e) {
      setFormErr(e instanceof Error ? e.message : i18n._(msg`Aktarma başarısız.`))
    } finally {
      setBusy(false)
    }
  }

  async function onDupTomorrow() {
    if (!task) return
    setFormErr(null)
    setBusy(true)
    try {
      const { data: me, error: e1 } = await supabase.rpc('current_person_id')
      if (e1) throw e1
      if (!me) throw new Error('me')
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
    if (!task) return
    if (fieldPick.length === 0) {
      setFormErr(i18n._(msg`En az bir tarla seçin.`))
      return
    }
    setFormErr(null)
    setBusy(true)
    try {
      const { data: me, error: e1 } = await supabase.rpc('current_person_id')
      if (e1) throw e1
      if (!me) throw new Error('me')
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

  if (!taskId) return null

  const aid = task ? activityIdFromDbValue(task.activity) : null
  const activityLabel = aid ? i18n._(ACTIVITY_LABEL[aid]) : task?.activity ?? ''
  const filteredFields = fields.filter((f) => fieldMatchesQuery(f.name, f.crop, fieldSearch))
  const fieldLine = task?.fields
    ? `${task.fields.name} \u2014 ${task.fields.crop}`
    : '\u2014'

  return (
    <>
    {/* Backdrop */}
    <div className="fixed inset-0 z-[1100] bg-[rgba(12,18,16,0.3)]" onClick={onClose} aria-hidden />
    <div
      className="fixed inset-y-0 right-0 z-[1200] flex w-[min(100vw,440px)] flex-col border-l border-border bg-surface-0 shadow-lg"
      role="dialog"
      aria-labelledby={titleId}
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-3">
        <h2 id={titleId} className="text-[15px] font-semibold text-fg">
          {t`Görev detayı`}
        </h2>
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface-1 text-fg transition-colors hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-orchard-500"
          aria-label={t`Kapat`}
        >
          <X className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>

      {isLoading ? <p className="p-5 text-sm text-fg-secondary">{t`Yükleniyor…`}</p> : null}
      {error ? (
        <p className="p-5 text-sm text-status-blocked">
          {error instanceof Error ? error.message : t`Görev yüklenemedi.`}
        </p>
      ) : null}

      {task && !isLoading && !error ? (
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-5 text-sm">
          {formErr ? <p className="text-sm text-status-blocked">{formErr}</p> : null}

          {/* Task header */}
          <div className="flex items-start gap-3">
            {aid ? <ActivityIcon id={aid} className="h-11 w-11 shrink-0" /> : null}
            <div className="min-w-0">
              <p className="text-lg font-semibold text-fg">{activityLabel}</p>
              <p className="text-[13px] text-fg-secondary">{fieldLine}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium', STATUS_CHIP[task.status])}>
                  <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOT[task.status])} aria-hidden />
                  {statusLabel(task.status)}
                </span>
                <span className="text-[12px] text-fg-muted">
                  {t`Son`}: {fmtDate(task.due_date)}
                </span>
              </div>
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-fg-muted">{i18n._(msg`Atanan`)}</p>
              <span className="mt-1 inline-flex items-center gap-1.5">
                <span className={cn('inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold', avatarColor(task.assignee?.full_name))}>
                  {initialsOf(task.assignee?.full_name)}
                </span>
                <span className="text-[13px] font-medium text-fg">{task.assignee?.full_name ?? '\u2014'}</span>
              </span>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-fg-muted">{i18n._(msg`Aktivite`)}</p>
              <p className="mt-1 text-[13px] font-medium text-fg">{activityLabel}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-fg-muted">{i18n._(msg`Son tarih`)}</p>
              <p className="mt-1 text-[13px] font-medium tabular-nums text-fg">{fmtDate(task.due_date)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-fg-muted">{i18n._(msg`Oluşturuldu`)}</p>
              <p className="mt-1 text-[13px] font-medium tabular-nums text-fg">{fmtDate(task.created_at)}</p>
            </div>
          </div>

          {/* Notes */}
          {task.notes ? (
            <p className="rounded-lg bg-surface-1 px-4 py-3 text-[13px] leading-relaxed text-fg-secondary">{task.notes}</p>
          ) : null}

          {/* Media */}
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-fg-muted">{i18n._(msg`Medya`)}</p>
            <TaskDetailMediaSection taskId={task.id} completionPhotoPath={task.completion_photo_url} />
          </div>

          {/* Reassign */}
          <div className="space-y-2 border-t border-border pt-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-fg-muted">{i18n._(msg`Aktar`)}</p>
            <div className="flex gap-2">
              <select
                className="min-w-0 flex-1 rounded-lg border border-border bg-surface-1 px-3 py-2 text-[13px] text-fg"
                value={newAssignee}
                onChange={(e) => setNewAssignee(e.target.value)}
              >
                <option value="">{i18n._(msg`Yeni sorumlu seç…`)}</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>{p.full_name}</option>
                ))}
              </select>
              <Button type="button" size="sm" onClick={() => void onReassign()} disabled={busy || !newAssignee}>
                {t`Aktar`}
              </Button>
            </div>
          </div>

          {/* Duplicate */}
          <div className="space-y-2 border-t border-border pt-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-fg-muted">{i18n._(msg`Kopyala`)}</p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => void onDupTomorrow()} disabled={busy}>
                {t`Yarın için kopyala`}
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setFieldDlg(true)} disabled={busy}>
                {t`Tarlalara kopyala…`}
              </Button>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-3 border-t border-border pt-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-fg-muted">{i18n._(msg`Zaman çizelgesi`)}</p>
            <ul className="space-y-3">
              {logRows.length === 0 ? (
                <li className="text-[12px] text-fg-muted">{t`Henüz kayıt yok.`}</li>
              ) : (
                logRows.map((r) => (
                  <li key={r.id} className="flex items-start gap-2.5">
                    <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', LOG_DOT[r.action] ?? 'bg-surface-2')} aria-hidden />
                    <div>
                      <p className="text-[13px] font-medium text-fg">{actionLabel(r.action)}</p>
                      <p className="text-[12px] text-fg-muted">
                        {r.actor?.full_name ?? '\u2014'}
                        {r.action === 'task.reassigned' && (r.payload as Record<string, string> | null)?.new_assignee_name
                          ? ` \u2192 ${(r.payload as Record<string, string>).new_assignee_name}`
                          : null}
                        {' \u00b7 '}
                        {fmtDatetime(r.created_at)}
                      </p>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      ) : null}

      {/* Field picker dialog */}
      {fieldDlg ? (
        <dialog
          open
          className="fixed inset-0 z-50 m-auto w-[min(100vw-2rem,400px)] rounded-2xl border border-border bg-surface-0 p-0 backdrop:bg-[rgba(12,18,16,0.55)]"
        >
          <div className="p-4">
            <p className="mb-2 text-[14px] font-semibold text-fg">{t`Kopyalanacak tarlalar`}</p>
            <input
              type="search"
              className="mb-2 w-full rounded-lg border border-border bg-surface-1 px-3 py-1.5 text-[13px] text-fg outline-none focus:ring-2 focus:ring-orchard-500/20"
              value={fieldSearch}
              onChange={(e) => setFieldSearch(e.target.value)}
            />
            <ul className="max-h-48 overflow-y-auto">
              {filteredFields.map((f) => (
                <li key={f.id} className="list-none">
                  <label className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1.5 text-[13px] hover:bg-surface-1">
                    <input
                      type="checkbox"
                      checked={fieldPick.includes(f.id)}
                      onChange={() => toggleField(f.id)}
                      className="h-3.5 w-3.5 rounded accent-orchard-500"
                    />
                    {f.name} ({f.crop})
                  </label>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex justify-end gap-2">
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
    </>
  )
}
