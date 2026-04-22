import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_owner/tasks')({
  component: TasksPage,
})

function TasksPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-fg">Görevler</h1>
      <p className="mt-2 text-fg-secondary">Placeholder.</p>
    </div>
  )
}
