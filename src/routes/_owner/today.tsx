import { t } from '@lingui/macro'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_owner/today')({
  component: TodayPage,
})

function TodayPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-fg">{t`Today`}</h1>
      <p className="mt-2 text-fg-secondary">
        {t`Owner home placeholder — M0-03 smoke; routing in M0-05.`}
      </p>
    </div>
  )
}
