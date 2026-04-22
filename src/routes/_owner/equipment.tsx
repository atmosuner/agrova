import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_owner/equipment')({
  component: EquipmentPage,
})

function EquipmentPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-fg">Ekipman</h1>
      <p className="mt-2 text-fg-secondary">Placeholder.</p>
    </div>
  )
}
