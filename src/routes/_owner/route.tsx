import { msg } from '@lingui/macro'
import { Link, Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { OperationSettingsProvider } from '@/features/settings/operation-settings-context'
import { useOperationSettings } from '@/features/settings/use-operation-settings'
import { i18n } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'

export const Route = createFileRoute('/_owner')({
  beforeLoad: async ({ location }) => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      throw redirect({
        to: '/login',
        search: { redirect: `${location.pathname}${location.search}` },
      })
    }
  },
  component: OwnerLayout,
})

function OwnerLayout() {
  return (
    <OperationSettingsProvider>
      <OwnerLayoutInner />
    </OperationSettingsProvider>
  )
}

const ownerNav = [
  { to: '/today', label: msg`Today` },
  { to: '/fields', label: msg`Fields` },
  { to: '/tasks', label: msg`Tasks` },
  { to: '/issues', label: msg`Issues` },
  { to: '/people', label: msg`Team` },
  { to: '/equipment', label: msg`Equipment` },
  { to: '/reports', label: msg`Reports` },
  { to: '/settings', label: msg`Settings` },
] as const

function OwnerLayoutInner() {
  const { settings, loading } = useOperationSettings()
  const headerTitle =
    !loading && settings?.operation_name?.trim() ? settings.operation_name.trim() : i18n._(msg`Agrova`)

  return (
    <div className="flex min-h-dvh">
      <aside className="flex w-60 flex-col border-r border-border bg-surface-0 px-3 py-4 text-sm">
        <div className="mb-6">
          <div className="font-medium leading-snug text-orchard-500">{headerTitle}</div>
          {!loading && settings?.operation_name?.trim() ? (
            <div className="text-xs text-fg-muted">{i18n._(msg`Agrova`)}</div>
          ) : null}
        </div>
        <nav className="flex flex-col gap-1">
          {ownerNav.map((item) => (
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
              {i18n._(item.label)}
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
