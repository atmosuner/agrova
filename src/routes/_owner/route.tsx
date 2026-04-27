/* eslint-disable lingui/no-unlocalized-strings -- Tailwind class strings, localStorage key, route paths */
import { msg, t } from '@lingui/macro'
import { defaultStringifySearch, Link, Outlet, createFileRoute, redirect, useRouterState } from '@tanstack/react-router'
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ListTodo,
  LogOut,
  MapPinned,
  MoreVertical,
  Search,
  Settings,
  Sun,
  TriangleAlert,
  Users,
  Wrench,
} from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { useOnClickOutside } from '@/lib/use-on-click-outside'
import { AgrovaLogoMark } from '@/components/icons/AgrovaLogoMark'
import { NotificationsBell } from '@/features/notifications/NotificationsBell'
import { RegisterOwnerWebPush } from '@/features/notifications/RegisterOwnerWebPush'
import { OperationSettingsProvider } from '@/features/settings/operation-settings-context'
import { useOperationSettings } from '@/features/settings/use-operation-settings'
import { useOpenIssueCount } from '@/features/issues/use-open-issue-count'
import { useMyPersonQuery } from '@/features/people/useMyPersonQuery'
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
      const returnTo = `${location.pathname}${defaultStringifySearch(location.search)}`
      throw redirect({ to: '/login', search: { redirect: returnTo } })
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

const OWNER_SIDEBAR_KEY = 'agrova:owner-sidebar-collapsed'

const ownerNav = [
  { to: '/today' as const, label: msg`Bugün`, icon: Sun },
  { to: '/fields' as const, label: msg`Tarlalar`, icon: MapPinned },
  { to: '/tasks' as const, label: msg`Görevler`, icon: ListTodo },
  { to: '/issues' as const, label: msg`Sorunlar`, icon: TriangleAlert, badge: 'issues' as const },
  { to: '/people' as const, label: msg`Ekip`, icon: Users },
  { to: '/equipment' as const, label: msg`Ekipman`, icon: Wrench },
  { to: '/reports' as const, label: msg`Raporlar`, icon: BarChart3 },
  { to: '/settings' as const, label: msg`Ayarlar`, icon: Settings },
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

function initialsFromName(name: string | undefined | null): string {
  if (!name?.trim()) return '?'
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '')).toUpperCase().slice(0, 2)
}

function OwnerLayoutInner() {
  const { settings, loading } = useOperationSettings()
  const openIssues = useOpenIssueCount()
  const { data: me } = useMyPersonQuery()
  const [sidebarCollapsed, toggleSidebar] = useOwnerSidebarCollapsed()
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  const operationName = !loading && settings?.operation_name?.trim() ? settings.operation_name.trim() : i18n._(msg`Agrova`)

  const activeNav = ownerNav.find((item) => pathname === item.to || pathname.startsWith(`${item.to}/`))
  const pageLabel = activeNav ? i18n._(activeNav.label) : i18n._(msg`Agrova`)
  const initials = initialsFromName(me?.full_name)

  return (
    <div className="flex min-h-dvh">
      <RegisterOwnerWebPush />

      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col border-r border-border bg-surface-0 transition-[width] duration-200 ease-out',
          sidebarCollapsed ? 'w-16' : 'w-60',
        )}
        aria-label={i18n._(msg`Sahip navigasyonu`)}
      >
        {/* Header: logo + operation name */}
        <div
          className={cn(
            'flex h-14 shrink-0 items-center border-b border-border',
            sidebarCollapsed ? 'justify-center px-2' : 'gap-2.5 px-3',
          )}
        >
          <AgrovaLogoMark size={28} radius={7} />
          {!sidebarCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold leading-tight text-fg">{operationName}</p>
              <p className="text-[11px] text-fg-muted">Agrova</p>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav id="owner-nav-rail" className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto p-2">
          {ownerNav.map((item) => {
            const label = i18n._(item.label)
            const Icon = item.icon
            const badge = 'badge' in item && item.badge === 'issues' && openIssues > 0 ? openIssues : null
            return (
              <Link
                key={item.to}
                to={item.to}
                title={sidebarCollapsed ? label : undefined}
                aria-label={sidebarCollapsed ? label : undefined}
                className={cn(
                  'flex h-9 items-center rounded-[6px] text-[13px] transition-colors',
                  sidebarCollapsed ? 'justify-center' : 'gap-2.5 px-2.5',
                )}
                activeProps={{
                  className: 'font-medium text-orchard-700 bg-orchard-50 dark:bg-surface-2',
                }}
                inactiveProps={{
                  className: 'text-fg-secondary hover:bg-surface-1 hover:text-fg',
                }}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} aria-hidden />
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1 truncate">{label}</span>
                    {badge ? (
                      <span className="inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-status-blocked px-1 text-[10px] font-semibold text-white">
                        {badge > 99 ? '99+' : badge}
                      </span>
                    ) : null}
                  </>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer: user info + overflow menu */}
        <SidebarFooter
          initials={initials}
          name={me?.full_name ?? '—'}
          role={me?.role ?? '—'}
          collapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
        />
      </aside>

      {/* Main area */}
      <div className="flex min-w-0 flex-1 flex-col bg-canvas">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-12 shrink-0 items-center gap-3 border-b border-border bg-surface-0/90 px-4 backdrop-blur supports-[backdrop-filter]:bg-surface-0/80">
          <p className="text-[13px] font-semibold text-fg">{pageLabel}</p>

          <button
            type="button"
            className="flex h-8 flex-1 items-center gap-2 rounded-[7px] border border-border bg-surface-1 px-3 text-left text-[13px] text-fg-muted transition hover:border-border-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orchard-500"
            aria-label={i18n._(msg`Ara veya komut girin`)}
          >
            <Search className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
            <span className="flex-1">{t`Ara veya komut girin…`}</span>
            <kbd className="hidden rounded bg-surface-2 px-1 py-0.5 text-[10px] font-medium text-fg-faint sm:inline">⌘K</kbd>
          </button>

          <div className="flex items-center gap-2">
            <NotificationsBell />
            <span
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orchard-100 text-[11px] font-semibold text-orchard-700"
              aria-hidden
            >
              {initials}
            </span>
          </div>
        </header>

        <main className="min-h-0 flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function SidebarFooter({
  initials,
  name,
  role,
  collapsed,
  onToggle,
}: {
  initials: string
  name: string
  role: string
  collapsed: boolean
  onToggle: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  useOnClickOutside(menuRef, () => setMenuOpen(false))

  if (collapsed) {
    return (
      <div className="shrink-0 border-t border-border p-2">
        <div className="flex flex-col items-center gap-1">
          <span
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-orchard-100 text-[11px] font-semibold text-orchard-700"
            aria-hidden
          >
            {initials}
          </span>
          <button
            type="button"
            onClick={onToggle}
            className="flex h-7 w-7 items-center justify-center rounded-[6px] text-fg-secondary hover:bg-surface-1 hover:text-fg focus-visible:ring-2 focus-visible:ring-orchard-500 focus-visible:ring-offset-2"
            aria-label={i18n._(msg`Menüyü genişlet`)}
            aria-expanded="false"
            aria-controls="owner-nav-rail"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2} aria-hidden />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="shrink-0 border-t border-border p-2">
      <div className="flex items-center gap-2">
        <span
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orchard-100 text-[11px] font-semibold text-orchard-700"
          aria-hidden
        >
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-medium text-fg">{name}</p>
          <p className="truncate text-[10px] text-fg-muted">{role}</p>
        </div>
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] text-fg-secondary hover:bg-surface-1 hover:text-fg focus-visible:ring-2 focus-visible:ring-orchard-500 focus-visible:ring-offset-2"
            aria-label={i18n._(msg`Hesap menüsü`)}
            aria-expanded={menuOpen}
            aria-haspopup="true"
          >
            <MoreVertical className="h-4 w-4" strokeWidth={2} aria-hidden />
          </button>
          {menuOpen ? (
            <div
              className="absolute bottom-full left-0 z-50 mb-1 w-48 rounded-lg border border-border-strong bg-surface-0 py-1 ring-[3px] ring-[rgba(12,18,16,0.04)]"
              role="menu"
            >
              <button
                type="button"
                onClick={onToggle}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-fg-secondary hover:bg-surface-1 hover:text-fg"
                role="menuitem"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                {i18n._(msg`Menüyü daralt`)}
              </button>
              <div className="my-1 border-t border-border" />
              <button
                type="button"
                onClick={async () => {
                  setMenuOpen(false)
                  await supabase.auth.signOut()
                  window.location.href = '/login'
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-status-blocked hover:bg-status-blocked/[0.06]"
                role="menuitem"
              >
                <LogOut className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                {i18n._(msg`Çıkış yap`)}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
