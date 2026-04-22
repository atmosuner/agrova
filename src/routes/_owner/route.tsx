import { Link, Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_owner')({
  component: OwnerLayout,
})

const nav = [
  { to: '/today', label: 'Bugün' },
  { to: '/fields', label: 'Tarlalar' },
  { to: '/tasks', label: 'Görevler' },
  { to: '/issues', label: 'Sorunlar' },
  { to: '/people', label: 'Ekip' },
  { to: '/equipment', label: 'Ekipman' },
  { to: '/reports', label: 'Raporlar' },
  { to: '/settings', label: 'Ayarlar' },
] as const

function OwnerLayout() {
  return (
    <div className="flex min-h-dvh">
      <aside className="flex w-60 flex-col border-r border-border bg-surface-0 px-3 py-4 text-sm">
        <div className="mb-6 font-medium text-orchard-500">Agrova</div>
        <nav className="flex flex-col gap-1">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-md px-2 py-2 text-fg-secondary hover:bg-surface-1 hover:text-fg"
              activeProps={{
                className:
                  'rounded-md px-2 py-2 font-medium text-orchard-700 bg-orchard-50 dark:bg-surface-2',
              }}
              inactiveProps={{ className: 'rounded-md px-2 py-2' }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1 bg-canvas p-6">
        <Outlet />
      </div>
    </div>
  )
}
