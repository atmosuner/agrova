import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/m/tasks')({
  component: MobileTasksPage,
})

function MobileTasksPage() {
  return (
    <div className="px-4 pt-6">
      <h1 className="text-xl font-semibold text-fg">Görevler</h1>
      <p className="mt-2 text-fg-secondary">Worker PWA list — /m prefix until role-based split.</p>
    </div>
  )
}
