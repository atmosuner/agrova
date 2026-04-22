import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_owner/reports')({
  component: ReportsPage,
})

function ReportsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-fg">Raporlar</h1>
      <p className="mt-2 text-fg-secondary">Placeholder.</p>
    </div>
  )
}
