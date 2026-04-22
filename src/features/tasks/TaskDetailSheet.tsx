/* eslint-disable lingui/no-unlocalized-strings -- layout utility classes */
import { t } from '@lingui/macro'
import { Button } from '@/components/ui/button'

type Props = {
  taskId: string | null
  onClose: () => void
}

/** M2-04: shell only; M2-06 adds timeline and reassignment. */
export function TaskDetailSheet({ taskId, onClose }: Props) {
  if (!taskId) {
    return null
  }
  return (
    <div
      key={taskId}
      className="fixed inset-y-0 right-0 z-40 flex w-[min(100vw,420px)] flex-col border-l border-border bg-surface-0 shadow-xl"
      role="dialog"
      aria-label={t`Görev detayı`}
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-lg font-semibold text-fg">{t`Görev`}</h2>
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          {t`Kapat`}
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 text-sm text-fg-secondary">
        <p>{t`Ayrıntılar burada görüntülenecek.`}</p>
      </div>
    </div>
  )
}
