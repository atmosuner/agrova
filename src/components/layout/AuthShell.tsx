import { msg } from '@lingui/macro'
import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { Sprout, Users, TriangleAlert } from 'lucide-react'
import { AgrovaLogoMark } from '@/components/icons/AgrovaLogoMark'
import { i18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

/**
 * Single auth shell used by /login, /signup, /forgot-password, /reset-password.
 *
 * On wide screens the desktop layout shows a green left panel with feature
 * bullets (the "owner" first impression). On narrow screens we collapse to a
 * single mobile column with the brand mark on top — that's the worker's first
 * impression so it must be calm and self-explanatory.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  showDesktopPanel = true,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
  showDesktopPanel?: boolean
}) {
  return (
    <div className="min-h-dvh bg-canvas">
      {showDesktopPanel ? (
        <div className="hidden min-h-dvh lg:flex">
          <DesktopLeftPanel />
          <main className="flex w-[480px] shrink-0 flex-col items-center justify-center bg-canvas px-12 py-12">
            <div className="w-full max-w-sm">
              <AuthHeader title={title} subtitle={subtitle} compact />
              {children}
              {footer ? <div className="mt-6">{footer}</div> : null}
            </div>
          </main>
        </div>
      ) : null}
      <div className={cn('flex min-h-dvh flex-col items-center px-4 py-10', showDesktopPanel && 'lg:hidden')}>
        <div className="flex w-full max-w-sm flex-1 flex-col justify-center">
          <div className="mb-7 flex flex-col items-center gap-2">
            <AgrovaLogoMark size={52} />
            <p className="text-base font-semibold tracking-[-0.01em] text-fg">{i18n._(msg`Agrova`)}</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface-0 p-6">
            <AuthHeader title={title} subtitle={subtitle} />
            {children}
          </div>
          {footer ? <div className="mt-5 flex flex-col items-center gap-2.5">{footer}</div> : null}
        </div>
      </div>
    </div>
  )
}

function AuthHeader({ title, subtitle, compact }: { title: string; subtitle?: string; compact?: boolean }) {
  return (
    <div className={cn('mb-5', compact && 'mb-6')}>
      <h1 className={cn('font-semibold tracking-[-0.01em] text-fg', compact ? 'text-[22px]' : 'text-xl')}>{title}</h1>
      {subtitle ? <p className="mt-1 text-sm text-fg-secondary">{subtitle}</p> : null}
    </div>
  )
}

function DesktopLeftPanel() {
  const features = [
    { icon: Sprout, label: i18n._(msg`500+ tarla harita üzerinde`) },
    { icon: Users, label: i18n._(msg`İşçi PWA · Çevrimdışı çalışır`) },
    { icon: TriangleAlert, label: i18n._(msg`Sorun bildirimi · Fotoğraf + ses`) },
  ]
  return (
    <aside
      className="flex flex-1 flex-col items-center justify-center gap-5 px-12 py-12 text-white"
      style={{ background: 'linear-gradient(160deg, #3F8B4E 0%, #2D6A3A 100%)' }}
    >
      <div className="flex w-full max-w-sm items-center gap-3">
        <span
          aria-hidden
          className="inline-flex h-11 w-11 items-center justify-center rounded-[13px]"
          style={{ background: 'rgba(255,255,255,0.15)' }}
        >
          <Sprout className="h-6 w-6 text-white" strokeWidth={1.75} />
        </span>
        <span className="text-[22px] font-semibold tracking-[-0.01em] text-white">{i18n._(msg`Agrova`)}</span>
      </div>
      <h2 className="max-w-sm text-center text-[32px] font-semibold leading-[1.15] tracking-[-0.01em]">
        {i18n._(msg`Bahçe yönetimi, sade ve güçlü.`)}
      </h2>
      <p className="max-w-sm text-center text-base leading-relaxed text-white/75">
        {i18n._(msg`500 tarla, 80 çalışan. Hepsini tek yerden yönetin.`)}
      </p>
      <ul className="flex w-full max-w-sm flex-col gap-2.5">
        {features.map(({ icon: Icon, label }) => (
          <li
            key={label}
            className="flex items-center gap-2.5 rounded-[10px] px-3.5 py-2.5 text-sm text-white/90"
            style={{ background: 'rgba(255,255,255,0.10)' }}
          >
            <Icon className="h-[18px] w-[18px] shrink-0 text-white/70" strokeWidth={1.75} aria-hidden />
            <span>{label}</span>
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-6">
        <Link to="/privacy" className="text-xs text-white/60 underline-offset-2 hover:underline">
          {i18n._(msg`Gizlilik`)}
        </Link>
      </div>
    </aside>
  )
}

/* eslint-disable lingui/no-unlocalized-strings -- Tailwind class strings, not user copy */
/** Shared input class for auth surfaces — 44px mobile, 36px desktop. */
export const authInputClassName =
  'h-11 w-full rounded-lg border border-border-strong bg-surface-0 px-3 text-[15px] text-fg outline-none transition focus:border-orchard-500 focus:ring-[3px] focus:ring-orchard-500/12 placeholder:text-fg-faint lg:h-9 lg:text-[13px]'

export const authInputErrorClassName =
  'h-11 w-full rounded-lg border border-status-blocked bg-surface-0 px-3 text-[15px] text-fg outline-none transition focus:ring-[3px] focus:ring-status-blocked/10 placeholder:text-fg-faint lg:h-9 lg:text-[13px]'

/** Pill-style auth primary CTA — 48px pill on mobile, 36px rectangle on desktop. */
export const authPrimaryButtonClassName =
  'inline-flex h-12 w-full items-center justify-center rounded-full bg-orchard-500 px-6 text-base font-semibold text-white transition hover:bg-orchard-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orchard-500 lg:h-9 lg:rounded-lg lg:px-4 lg:text-[13px] lg:font-medium'
/* eslint-enable lingui/no-unlocalized-strings */

/** Inline error strip used on form cards. */
export function AuthErrorMessage({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="rounded-lg border border-status-blocked/15 bg-status-blocked/[0.06] px-3 py-2.5 text-[13px] text-status-blocked"
    >
      {children}
    </p>
  )
}
