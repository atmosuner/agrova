import { t } from '@lingui/macro'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_owner/people')({
  component: PeoplePage,
})

function PeoplePage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-fg">{t`Team`}</h1>
      <p className="mt-2 text-fg-secondary">{t`Placeholder.`}</p>
    </div>
  )
}
