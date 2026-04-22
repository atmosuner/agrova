import { msg } from '@lingui/macro'
import { Link, Outlet, createFileRoute } from '@tanstack/react-router'
import { i18n } from '@/lib/i18n'

/* Worker PWA shell — URL prefix /m to avoid clashing with owner /tasks, /profile, etc. */
export const Route = createFileRoute('/m')({
  component: MobileLayout,
})

const bottomTabs = [
  { to: '/m/tasks', label: msg`Tasks` },
  { to: '/m/history', label: msg`History` },
  { to: '/m/profile', label: msg`Profile` },
] as const

function MobileLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas pb-20">
      <div className="min-h-0 flex-1">
        <Outlet />
      </div>
      <nav className="fixed bottom-0 left-0 right-0 flex h-[4.5rem] items-center justify-around border-t border-border bg-surface-0 text-xs text-fg-secondary">
        {bottomTabs.map((tab) => (
          <Link
            key={tab.to}
            to={tab.to}
            activeProps={{
              className: 'font-medium text-orchard-500',
            }}
            className="flex flex-1 flex-col items-center justify-center gap-1 py-2"
            inactiveProps={{ className: 'text-fg-secondary' }}
          >
            {i18n._(tab.label)}
          </Link>
        ))}
      </nav>
    </div>
  )
}
