import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/m/history')({
  component: HistoryPage,
})

function HistoryPage() {
  return (
    <div className="px-4 pt-6">
      <h1 className="text-xl font-semibold text-fg">Geçmiş</h1>
      <p className="mt-2 text-fg-secondary">Placeholder.</p>
    </div>
  )
}
