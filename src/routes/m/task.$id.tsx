/* eslint-disable lingui/no-unlocalized-strings */
import { msg, t } from '@lingui/macro'
import { useMemo, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { ChevronLeft } from 'lucide-react'
import { useTaskDetailQuery } from '@/features/tasks/useTaskDetailQuery'
import { useMyPersonQuery } from '@/features/people/useMyPersonQuery'
import { activityIdFromDbValue, ACTIVITY_LABEL } from '@/features/tasks/activities'
import { ActivityIcon } from '@/components/icons/activities/ActivityIcon'
import { StatusPill } from '@/features/tasks/TaskCard.mobile'
import { WorkerButton } from '@/components/ui/WorkerButton'
import { i18n } from '@/lib/i18n'
import { transitionTask } from '@/features/tasks/transition-task'
import { CompletionFlow } from '@/features/tasks/CompletionFlow'
import { ReassignSheetMobile } from '@/features/tasks/ReassignSheet.mobile'
import { AttachSheetMobile } from '@/features/equipment/AttachSheet.mobile'

export const Route = createFileRoute('/m/task/$id')({
  component: TaskDetailPage,
})

function TaskDetailPage() {
  const { id } = Route.useParams()
  const { data: me } = useMyPersonQuery()
  const { data: task, isLoading, error, refetch } = useTaskDetailQuery(id)
  const [flow, setFlow] = useState(false)
  const [reassign, setReassign] = useState(false)
  const [attach, setAttach] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const assignee = task?.assignee_id
  const mine = me?.id && assignee && me.id === assignee
  const attachedEquipmentIds = useMemo(
    () => new Set((task?.task_equipment ?? []).map((r) => r.equipment_id)),
    [task?.task_equipment],
  )
  const aid = task ? activityIdFromDbValue(task.activity) : null
  const title = aid ? i18n._(ACTIVITY_LABEL[aid]) : (task?.activity ?? '—')

  async function onStart() {
    if (!task) {
      return
    }
    setErr(null)
    setBusy(true)
    try {
      await transitionTask({ taskId: task.id, fromStatus: 'TODO', toStatus: 'IN_PROGRESS' })
      await refetch()
      void queryClient.invalidateQueries({ queryKey: ['my-open-tasks'] })
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  if (isLoading) {
    return (
      <div className="px-4 pt-6">
        <p className="text-sm text-fg-secondary">{t`Yükleniyor…`}</p>
      </div>
    )
  }

  if (error || !task) {
    return (
      <div className="px-4 pt-6">
        <p className="text-status-blocked">{t`Görev bulunamadı.`}</p>
        <Link to="/m/tasks" className="mt-2 inline-block text-orchard-500">
          {t`Görevlere dön`}
        </Link>
      </div>
    )
  }

  if (!mine) {
    return (
      <div className="px-4 pt-6">
        <p className="text-fg-secondary">{t`Bu görev size atanmamış.`}</p>
        <Link to="/m/tasks" className="mt-2 inline-block text-orchard-500">
          {t`Görevlere dön`}
        </Link>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col pb-6">
      <div className="flex-1 px-4 pt-4">
        <Link
          to="/m/tasks"
          className="inline-flex items-center gap-1 text-sm font-medium text-orchard-500"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
          {i18n._(msg`Görevler`)}
        </Link>

        <div className="mt-4 flex items-start gap-3.5">
          <div className="inline-flex h-[88px] w-[88px] shrink-0 items-center justify-center rounded-[20px] bg-orchard-50 dark:bg-orchard-500/10">
            {aid ? <ActivityIcon id={aid} className="h-[52px] w-[52px] text-orchard-500" /> : null}
          </div>
          <div className="min-w-0 pt-1">
            <h1 className="text-[22px] font-semibold leading-[1.15] text-fg">{title}</h1>
            <p className="mt-1 truncate text-base text-fg-secondary">{task.fields?.name ?? '—'}</p>
            <div className="mt-2">
              <StatusPill status={task.status} />
            </div>
          </div>
        </div>

        {task.notes ? (
          <p className="mt-4 rounded-xl bg-surface-1 p-3.5 text-[15px] leading-relaxed text-fg-secondary">
            {task.notes}
          </p>
        ) : null}

        {err ? (
          <p
            role="alert"
            className="mt-3 rounded-lg border border-status-blocked/15 bg-status-blocked/[0.06] px-3 py-2 text-[13px] text-status-blocked"
          >
            {err}
          </p>
        ) : null}
      </div>

      {task.status === 'TODO' || task.status === 'IN_PROGRESS' ? (
        <div className="mt-4 px-4">
          {task.status === 'TODO' ? (
            <>
              <WorkerButton onClick={onStart} disabled={busy}>
                {busy ? t`…` : t`Başla`}
              </WorkerButton>
              <SecondaryRow disabled={busy}>
                <SecondaryButton onClick={() => setAttach(true)} disabled={busy}>
                  {t`Alet`}
                </SecondaryButton>
              </SecondaryRow>
            </>
          ) : null}
          {task.status === 'IN_PROGRESS' ? (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => setFlow(true)}
                className="inline-flex h-[72px] w-full items-center justify-center rounded-full bg-status-done text-xl font-semibold text-white transition hover:opacity-95 active:scale-[0.97] disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-status-done"
              >
                {t`Bitir`}
              </button>
              <SecondaryRow disabled={busy}>
                <SecondaryButton onClick={() => setReassign(true)} disabled={busy}>
                  {t`Aktar`}
                </SecondaryButton>
                <SecondaryButton onClick={() => setAttach(true)} disabled={busy}>
                  {t`Alet`}
                </SecondaryButton>
                <Link
                  to="/m/report-issue"
                  search={{ taskId: task.id, fieldId: task.field_id }}
                  aria-label={t`Sorun bildir`}
                  className="inline-flex h-[52px] w-full items-center justify-center rounded-full border border-status-blocked/25 bg-surface-0 text-[15px] font-medium text-status-blocked transition hover:bg-status-blocked/5 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-status-blocked"
                >
                  {t`Sorun`}
                </Link>
              </SecondaryRow>
            </>
          ) : null}
        </div>
      ) : null}

      {flow && me ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-canvas/95 p-0 sm:items-center">
          <div className="h-full w-full max-w-md overflow-y-auto sm:h-auto sm:max-h-[90vh] sm:rounded-2xl sm:border sm:border-border sm:bg-surface-0 sm:p-0">
            {task.status === 'IN_PROGRESS' ? (
              <CompletionFlow taskId={task.id} fromStatus="IN_PROGRESS" onClose={() => setFlow(false)} />
            ) : null}
          </div>
        </div>
      ) : null}
      {reassign && me ? (
        <ReassignSheetMobile taskId={task.id} currentPersonId={me.id} onClose={() => setReassign(false)} />
      ) : null}
      {attach ? (
        <AttachSheetMobile taskId={task.id} attachedIds={attachedEquipmentIds} onClose={() => setAttach(false)} />
      ) : null}
    </div>
  )
}

function SecondaryRow({ children, disabled }: { children: React.ReactNode; disabled?: boolean }) {
  return (
    <div className="mt-2.5 grid grid-cols-3 gap-2" aria-disabled={disabled || undefined}>
      {children}
    </div>
  )
}

function SecondaryButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-[52px] w-full items-center justify-center rounded-full border border-border-strong bg-surface-0 text-[15px] font-medium text-fg transition hover:bg-surface-1 active:scale-[0.98] disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orchard-500"
    >
      {children}
    </button>
  )
}
