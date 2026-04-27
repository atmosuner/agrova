/* eslint-disable lingui/no-unlocalized-strings -- Intl format args + IANA tz */
import { msg, t } from '@lingui/macro'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import { useEffect, useRef, useSyncExternalStore } from 'react'
import { CheckCircle2, ClipboardList, User } from 'lucide-react'
import { InstallPrompt } from '@/components/InstallPrompt'
import { SyncIndicator } from '@/components/SyncIndicator'
import { bootstrapReadCachesForWorker } from '@/features/bootstrap/bootstrap-cache'
import { firstNameFromFull, useMyPersonQuery } from '@/features/people/useMyPersonQuery'
import { db } from '@/lib/db'
import { drainOutbox } from '@/lib/sync'
import { i18n } from '@/lib/i18n'
import { applyThemeToDocument, getStoredAgrovaTheme } from '@/lib/theme'
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

function subscribeOnline(cb: () => void) {
  globalThis.addEventListener('online', cb)
  globalThis.addEventListener('offline', cb)
  return () => {
    globalThis.removeEventListener('online', cb)
    globalThis.removeEventListener('offline', cb)
  }
}
function getOnline() {
  return typeof navigator !== 'undefined' ? navigator.onLine !== false : true
}

export function MobileShell() {
  const { data: me, isSuccess } = useMyPersonQuery()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isOnline = useSyncExternalStore(subscribeOnline, getOnline)
  const pending = useLiveQuery(() => db.outbox.count(), [], 0) ?? 0
  const themeBeforeMobileRef = useRef<ReturnType<typeof getStoredAgrovaTheme> | null>(null)

  useEffect(() => {
    themeBeforeMobileRef.current = getStoredAgrovaTheme()
    applyThemeToDocument('light')
    return () => {
      const previous = themeBeforeMobileRef.current
      if (previous != null) {
        applyThemeToDocument(previous)
      }
    }
  }, [])

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
      {/* Header */}
      <header className="sticky top-[env(safe-area-inset-top,0px)] z-30 flex items-center justify-between gap-3 border-b border-border bg-surface-0/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-surface-0/80">
        <div className="min-w-0">
          <p className="truncate text-[18px] font-medium leading-tight text-fg">
            {t`Merhaba`}, {firstNameFromFull(me?.full_name)}
          </p>
          <p className="mt-0.5 text-[12px] capitalize text-fg-muted">{formatTrDateHeader()}</p>
        </div>
        <SyncIndicator />
      </header>

      {/* Offline banner */}
      {!isOnline && (
        <div
          className="flex items-center gap-2 border-b border-border bg-surface-2 px-4 py-2 text-[13px] text-fg-secondary"
          role="status"
          aria-live="polite"
        >
          <span className="flex-1">{t`Çevrimdışısınız — işiniz kaydediliyor`}</span>
          {pending > 0 && (
            <span className="inline-flex items-center rounded-full bg-surface-1 px-2 py-0.5 text-[11px] font-semibold text-fg-muted">
              {pending} {t`bekliyor`}
            </span>
          )}
        </div>
      )}

      <div className="min-h-0 flex-1">
        <Outlet />
      </div>

      {/* Bottom tab bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 flex min-h-[4.5rem] items-stretch justify-around border-t border-border bg-surface-0 pb-[env(safe-area-inset-bottom,0px)]"
        aria-label={i18n._(msg`İşçi navigasyonu`)}
      >
        {bottomTabs.map((tab) => {
          const active = pathname === tab.to || pathname.startsWith(`${tab.to}/`)
          const Icon = tab.icon
          const label = i18n._(tab.label)
          return (
            <Link
              key={tab.to}
              to={tab.to}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 pt-2 pb-1 transition-colors',
                active ? 'text-orchard-500' : 'text-fg-muted',
              )}
            >
              <Icon
                className={cn('h-7 w-7 shrink-0', active ? 'stroke-[2]' : 'stroke-[1.75]')}
                aria-hidden
              />
              <span className={cn('text-[11px] font-medium truncate', active ? 'font-semibold' : '')}>
                {label}
              </span>
            </Link>
          )
        })}
      </nav>

      <InstallPrompt />
    </div>
  )
}
