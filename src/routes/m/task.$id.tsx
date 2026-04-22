/* eslint-disable lingui/no-unlocalized-strings */
import { msg, t } from '@lingui/macro'
import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useTaskDetailQuery } from '@/features/tasks/useTaskDetailQuery'
import { useMyPersonQuery } from '@/features/people/useMyPersonQuery'
import { activityIdFromDbValue, ACTIVITY_LABEL } from '@/features/tasks/activities'
import { ActivityIcon } from '@/components/icons/activities/ActivityIcon'
import { WorkerButton } from '@/components/ui/WorkerButton'
import { Button } from '@/components/ui/button'
import { i18n } from '@/lib/i18n'
import { transitionTask } from '@/features/tasks/transition-task'
import { CompletionFlow } from '@/features/tasks/CompletionFlow'
import { ReassignSheetMobile } from '@/features/tasks/ReassignSheet.mobile'

export const Route = createFileRoute('/m/task/$id')({
  component: TaskDetailPage,
})

function TaskDetailPage() {
  const { id } = Route.useParams()
  const { data: me } = useMyPersonQuery()
  const { data: task, isLoading, error, refetch } = useTaskDetailQuery(id)
  const [flow, setFlow] = useState(false)
  const [reassign, setReassign] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const assignee = task?.assignee_id
  const mine = me?.id && assignee && me.id === assignee
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
      void queryClient.invalidateQueries({ queryKey: ['my-today-tasks'] })
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
        <p className="text-harvest-500">{t`Görev bulunamadı.`}</p>
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
    <div className="flex min-h-0 flex-1 flex-col pb-28">
      <div className="px-4 pt-4">
        <Link to="/m/tasks" className="text-sm text-orchard-600">
          ← {i18n._(msg`Görevler`)}
        </Link>
        <div className="mt-3 flex items-start gap-3">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-orchard-50 dark:bg-orchard-500/10">
            {aid ? <ActivityIcon id={aid} className="h-16 w-16" /> : null}
          </div>
          <div>
            <h1 className="text-xl font-semibold text-fg">{title}</h1>
            <p className="text-fg-secondary">{task.fields?.name ?? '—'}</p>
          </div>
        </div>
        {task.notes ? <p className="mt-3 text-sm text-fg-secondary">{task.notes}</p> : null}
        {err ? <p className="mt-2 text-sm text-harvest-500">{err}</p> : null}
      </div>
      {task.status === 'TODO' || task.status === 'IN_PROGRESS' ? (
        <div className="mt-auto w-full max-w-md self-center px-4">
          {task.status === 'TODO' ? (
            <WorkerButton onClick={onStart} disabled={busy}>
              {busy ? t`…` : t`Başla`}
            </WorkerButton>
          ) : null}
          {task.status === 'IN_PROGRESS' ? (
            <>
              <WorkerButton
                onClick={() => {
                  setFlow(true)
                }}
                className="mb-2"
                disabled={busy}
              >
                {t`Bitir`}
              </WorkerButton>
              <Button
                type="button"
                variant="secondary"
                className="h-12 w-full rounded-full"
                onClick={() => setReassign(true)}
                disabled={busy}
              >
                {t`Aktar`}
              </Button>
              <Button type="button" variant="outline" className="mt-2 h-12 w-full rounded-full" disabled={busy} asChild>
                <Link
                  to="/m/report-issue"
                  search={{ taskId: task.id, fieldId: task.field_id }}
                  aria-label={t`Sorun bildir`}
                >
                  {t`Sorun`}
                </Link>
              </Button>
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
    </div>
  )
}
