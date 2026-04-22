import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_owner/today')({
  component: TodayPage,
})

function TodayPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-fg">Bugün</h1>
      <p className="mt-2 text-fg-secondary">M0-05 — owner home placeholder.</p>
    </div>
  )
}
