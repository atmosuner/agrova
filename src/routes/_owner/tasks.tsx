import { t } from '@lingui/macro'
import { createFileRoute } from '@tanstack/react-router'
import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { TaskCreateModal } from '@/features/tasks/TaskCreateModal'

export const Route = createFileRoute('/_owner/tasks')({
  component: TasksPage,
})

function TasksPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const headingId = useId()
  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 id={headingId} className="text-2xl font-semibold tracking-tight text-fg">
            {t`Tasks`}
          </h1>
          <p className="mt-1 text-fg-secondary">{t`Plan and assign work across fields.`}</p>
        </div>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          {t`Yeni görev`}
        </Button>
      </div>
      <TaskCreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}
