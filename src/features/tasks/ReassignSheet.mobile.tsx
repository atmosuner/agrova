/* eslint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/macro'
import { useState } from 'react'
import { X } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { useAssignablePeopleQuery } from '@/features/tasks/useAssignablePeopleQuery'
import { queueTaskReassign } from '@/features/tasks/worker-mutations'
import { useNavigate } from '@tanstack/react-router'
import { cn } from '@/lib/utils'

type Props = {
  taskId: string
  currentPersonId: string
  onClose: () => void
}

export function ReassignSheetMobile({ taskId, currentPersonId, onClose }: Props) {
  const { data: people, isLoading } = useAssignablePeopleQuery()
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const choices = (people ?? []).filter((p) => p.id !== currentPersonId)

  async function pick(id: string) {
    setErr(null)
    setBusy(true)
    try {
      await queueTaskReassign({ taskId, newAssigneeId: id })
      await queryClient.invalidateQueries({ queryKey: ['my-open-tasks'] })
      await queryClient.invalidateQueries({ queryKey: ['task', taskId] })
      onClose()
      void navigate({ to: '/m/tasks', replace: true })
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal
      onClick={onClose}
    >
      <div
        className={cn(
          'max-h-[80vh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-border bg-surface-0 p-4 sm:rounded-2xl',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-medium text-fg">{t`Aktar`}</h2>
          <Button type="button" variant="ghost" size="icon" aria-label={t`Kapat`} onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        {isLoading ? <p className="text-sm text-fg-secondary">{t`Yükleniyor…`}</p> : null}
        {err ? <p className="text-sm text-harvest-500">{err}</p> : null}
        <ul className="mt-2 flex flex-col gap-1">
          {choices.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className="flex w-full rounded-lg border border-border bg-surface-1 px-3 py-3 text-left text-fg"
                disabled={busy}
                onClick={() => void pick(p.id)}
              >
                {p.full_name}
                <span className="ml-2 text-fg-faint">({p.role})</span>
              </button>
            </li>
          ))}
        </ul>
        {choices.length === 0 && !isLoading ? (
          <p className="text-sm text-fg-secondary">{t`Aktarılabilir başka ekip yok.`}</p>
        ) : null}
      </div>
    </div>
  )
}
