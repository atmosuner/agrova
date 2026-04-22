import { t } from '@lingui/macro'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/m/tasks')({
  component: MobileTasksPage,
})

function MobileTasksPage() {
  return (
    <div className="px-4 pt-6">
      <h1 className="text-xl font-semibold text-fg">{t`Tasks`}</h1>
      <p className="mt-2 text-fg-secondary">
        {t`Worker PWA task list — /m URL prefix until role-based routing.`}
      </p>
    </div>
  )
}
