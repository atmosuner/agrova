import { t } from '@lingui/macro'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/m/report-issue')({
  component: ReportIssuePage,
})

function ReportIssuePage() {
  return (
    <div className="px-4 pt-6">
      <h1 className="text-xl font-semibold text-fg">{t`Report an issue`}</h1>
      <p className="mt-2 text-fg-secondary">{t`Placeholder.`}</p>
    </div>
  )
}
