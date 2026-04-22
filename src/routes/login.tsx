import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4">
      <h1 className="text-2xl font-semibold text-fg">Giriş (owner)</h1>
      <p className="text-center text-fg-secondary">M0-05 — auth form lands in M1.</p>
      <Link
        to="/today"
        className="text-sm font-medium text-orchard-500 underline-offset-2 hover:underline"
      >
        Devam: Bugün
      </Link>
    </div>
  )
}
