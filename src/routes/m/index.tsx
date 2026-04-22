import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/m/')({
  beforeLoad: () => {
    throw redirect({ to: '/m/tasks' })
  },
})
