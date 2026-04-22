import { msg } from '@lingui/macro'
import { defaultStringifySearch, Link, Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ListTodo,
  MapPinned,
  Settings,
  Sun,
  Sprout,
  TriangleAlert,
  Users,
  Wrench,
} from 'lucide-react'
import { useCallback, useState } from 'react'
import { NotificationsBell } from '@/features/notifications/NotificationsBell'
import { RegisterOwnerWebPush } from '@/features/notifications/RegisterOwnerWebPush'
import { OperationSettingsProvider } from '@/features/settings/operation-settings-context'
import { useOperationSettings } from '@/features/settings/use-operation-settings'
import { resolveAppShellForUser } from '@/features/auth/resolve-app-shell'
import { i18n } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_owner')({
  beforeLoad: async ({ location }) => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      // `location.search` is a parsed object, not a query string; stringify for /login?redirect=…
      const returnTo = `${location.pathname}${defaultStringifySearch(location.search)}`
      throw redirect({
        to: '/login',
        search: { redirect: returnTo },
      })
    }
    const shell = await resolveAppShellForUser(session.user)
    if (shell === 'worker') {
      throw redirect({ to: '/m/tasks' })
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

/** localStorage; not user-facing */
const OWNER_SIDEBAR_KEY = 'agrova:owner-sidebar-collapsed' // eslint-disable-line lingui/no-unlocalized-strings

const ownerNav = [
  { to: '/today' as const, label: msg`Today`, icon: Sun },
  { to: '/fields' as const, label: msg`Fields`, icon: MapPinned },
  { to: '/tasks' as const, label: msg`Tasks`, icon: ListTodo },
  { to: '/issues' as const, label: msg`Sorunlar`, icon: TriangleAlert },
  { to: '/people' as const, label: msg`Team`, icon: Users },
  { to: '/equipment' as const, label: msg`Equipment`, icon: Wrench },
  { to: '/reports' as const, label: msg`Reports`, icon: BarChart3 },
  { to: '/settings' as const, label: msg`Settings`, icon: Settings },
] as const

function useOwnerSidebarCollapsed(): [boolean, () => void] {
  const [collapsed, setCollapsed] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem(OWNER_SIDEBAR_KEY) === '1',
  )
  const toggle = useCallback(() => {
    setCollapsed((c) => {
      const next = !c
      try {
        localStorage.setItem(OWNER_SIDEBAR_KEY, next ? '1' : '0')
      } catch {
        // ignore
      }
      return next
    })
  }, [])
  return [collapsed, toggle]
}

function OwnerLayoutInner() {
  const { settings, loading } = useOperationSettings()
  const [sidebarCollapsed, toggleSidebar] = useOwnerSidebarCollapsed()
  const headerTitle =
    !loading && settings?.operation_name?.trim() ? settings.operation_name.trim() : i18n._(msg`Agrova`)

  return (
    <div className="flex min-h-dvh">
      <RegisterOwnerWebPush />
      <aside
        className={cn(
          'flex flex-col border-r border-border bg-surface-0 py-4 text-sm transition-[width] duration-200 ease-out',
          sidebarCollapsed ? 'w-16 px-2' : 'w-60 px-3',
        )}
        aria-label={i18n._(msg`Owner navigation`)}
      >
        <div className="mb-6">
          {sidebarCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              <Sprout className="h-7 w-7 shrink-0 text-orchard-500" aria-hidden />
              <button
                type="button"
                onClick={toggleSidebar}
                className="rounded-md p-1.5 text-fg-secondary hover:bg-surface-1 hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orchard-500"
                title={i18n._(msg`Expand navigation`)}
                aria-expanded="false"
                aria-controls="owner-nav-rail"
              >
                <ChevronRight className="h-5 w-5" strokeWidth={2} aria-hidden />
                <span className="sr-only">{i18n._(msg`Expand navigation`)}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-1">
              <div className="min-w-0 flex-1">
                <div className="font-medium leading-snug text-orchard-500">{headerTitle}</div>
                {!loading && settings?.operation_name?.trim() ? (
                  <div className="text-xs text-fg-muted">{i18n._(msg`Agrova`)}</div>
                ) : null}
              </div>
              <button
                type="button"
                onClick={toggleSidebar}
                className="shrink-0 rounded-md p-1.5 text-fg-secondary hover:bg-surface-1 hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orchard-500"
                title={i18n._(msg`Collapse navigation`)}
                aria-expanded="true"
                aria-controls="owner-nav-rail"
              >
                <ChevronLeft className="h-5 w-5" strokeWidth={2} aria-hidden />
                <span className="sr-only">{i18n._(msg`Collapse navigation`)}</span>
              </button>
            </div>
          )}
        </div>
        <nav id="owner-nav-rail" className="flex min-h-0 flex-1 flex-col gap-1">
          {ownerNav.map((item) => {
            const label = i18n._(item.label)
            const Icon = item.icon
            return (
              <Link
                key={item.to}
                to={item.to}
                title={label}
                aria-label={label}
                className={cn(
                  'rounded-md text-fg-secondary hover:bg-surface-1 hover:text-fg',
                  sidebarCollapsed ? 'inline-flex h-9 w-full items-center justify-center p-0' : 'px-2 py-2',
                )}
                activeProps={{
                  className: cn(
                    'font-medium text-orchard-700',
                    sidebarCollapsed
                      ? 'inline-flex h-9 w-full items-center justify-center rounded-md bg-orchard-50 p-0 dark:bg-surface-2'
                      : 'rounded-md px-2 py-2 font-medium text-orchard-700 bg-orchard-50 dark:bg-surface-2',
                  ),
                }}
                inactiveProps={{
                  className: cn(sidebarCollapsed ? 'inline-flex h-9 w-full items-center justify-center p-0' : 'rounded-md px-2 py-2'),
                }}
              >
                {sidebarCollapsed ? (
                  <Icon className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
                ) : (
                  <span className="block truncate">{label}</span>
                )}
              </Link>
            )
          })}
        </nav>
      </aside>
      <div className="min-w-0 flex-1 bg-canvas p-6">
        <div className="mb-4 flex justify-end">
          <NotificationsBell />
        </div>
        <Outlet />
      </div>
    </div>
  )
}
