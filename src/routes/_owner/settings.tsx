import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_owner/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-fg">Ayarlar</h1>
      <p className="mt-2 text-fg-secondary">Placeholder.</p>
    </div>
  )
}
