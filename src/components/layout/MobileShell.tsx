/* eslint-disable lingui/no-unlocalized-strings */
import { msg, t } from '@lingui/macro'
import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import { useEffect } from 'react'
import { CheckCircle2, ClipboardList, User } from 'lucide-react'
import { InstallPrompt } from '@/components/InstallPrompt'
import { SyncIndicator } from '@/components/SyncIndicator'
import { bootstrapReadCachesForWorker } from '@/features/bootstrap/bootstrap-cache'
import { firstNameFromFull, useMyPersonQuery } from '@/features/people/useMyPersonQuery'
import { drainOutbox } from '@/lib/sync'
import { i18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const bottomTabs = [
  { to: '/m/tasks', label: msg`Yapılacak`, icon: ClipboardList },
  { to: '/m/history', label: msg`Geçmiş`, icon: CheckCircle2 },
  { to: '/m/profile', label: msg`Profil`, icon: User },
] as const

function formatTrDateHeader(): string {
  return new Intl.DateTimeFormat('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/Istanbul',
  }).format(new Date())
}

export function MobileShell() {
  const { data: me, isSuccess } = useMyPersonQuery()
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  useEffect(() => {
    if (!isSuccess || !me?.id) {
      return
    }
    void bootstrapReadCachesForWorker(me.id).catch(() => {})
  }, [isSuccess, me?.id])

  useEffect(() => {
    const on = () => void drainOutbox()
    globalThis.addEventListener('online', on)
    void drainOutbox()
    return () => globalThis.removeEventListener('online', on)
  }, [])

  return (
    <div className="flex min-h-dvh flex-col bg-canvas pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] pt-[env(safe-area-inset-top,0px)]">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-border bg-surface-0/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-surface-0/80">
        <div className="min-w-0">
          <p className="truncate text-lg font-medium text-fg">
            {t`Merhaba`}, {firstNameFromFull(me?.full_name)}
          </p>
          <p className="text-xs capitalize text-fg-muted">{formatTrDateHeader()}</p>
        </div>
        <SyncIndicator />
      </header>
      <div className="min-h-0 flex-1">
        <Outlet />
      </div>
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 flex h-[4.5rem] min-h-[4.5rem] items-stretch justify-around border-t border-border bg-surface-0 pb-[env(safe-area-inset-bottom,0px)] text-xs text-fg-secondary"
        aria-label={i18n._(msg`Worker navigation`)}
      >
        {bottomTabs.map((tab) => {
          const active = pathname === tab.to || pathname.startsWith(`${tab.to}/`)
          const Icon = tab.icon
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors',
                active ? 'font-medium text-orchard-500' : 'text-fg-secondary',
              )}
            >
              <Icon className="h-7 w-7 shrink-0" aria-hidden />
              <span className="truncate">{i18n._(tab.label)}</span>
            </Link>
          )
        })}
      </nav>
      <InstallPrompt />
    </div>
  )
}
