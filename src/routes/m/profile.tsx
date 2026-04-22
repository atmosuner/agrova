import { t } from '@lingui/macro'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/m/profile')({
  component: ProfilePage,
})

function ProfilePage() {
  return (
    <div className="px-4 pt-6">
      <h1 className="text-xl font-semibold text-fg">{t`Profile`}</h1>
      <p className="mt-2 text-fg-secondary">{t`Placeholder.`}</p>
    </div>
  )
}
