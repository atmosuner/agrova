import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/m/task/$id')({
  component: TaskDetailPage,
})

function TaskDetailPage() {
  const { id } = Route.useParams()
  return (
    <div className="px-4 pt-6">
      <h1 className="text-xl font-semibold text-fg">Görev</h1>
      <p className="mt-2 font-mono text-sm text-fg-muted">{id}</p>
    </div>
  )
}
