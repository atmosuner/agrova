import { t } from '@lingui/macro'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_owner/reports')({
  component: ReportsPage,
})

function ReportsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-fg">{t`Reports`}</h1>
      <p className="mt-2 text-fg-secondary">{t`Placeholder.`}</p>
    </div>
  )
}
