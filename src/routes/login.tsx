import { t } from '@lingui/macro'
import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4">
      <h1 className="text-2xl font-semibold text-fg">{t`Owner sign-in`}</h1>
      <p className="text-center text-fg-secondary">
        {t`Authentication form ships in a later milestone.`}
      </p>
      <Link
        to="/today"
        className="text-sm font-medium text-orchard-500 underline-offset-2 hover:underline"
      >
        {t`Continue to Today`}
      </Link>
    </div>
  )
}
