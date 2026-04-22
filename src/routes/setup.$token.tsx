import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/setup/$token')({
  component: SetupPage,
})

function SetupPage() {
  const { token } = Route.useParams()
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-2 px-4">
      <h1 className="text-xl font-semibold text-fg">Kurulum</h1>
      <p className="break-all font-mono text-sm text-fg-muted">{token}</p>
    </div>
  )
}
