/* eslint-disable lingui/no-unlocalized-strings -- Tailwind class strings & inline SVG attrs, not user copy */
import { Link } from '@tanstack/react-router'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type StatTone = 'neutral' | 'good' | 'bad' | 'warning'

const valueToneClass: Record<StatTone, string> = {
  neutral: 'text-fg',
  good: 'text-orchard-700 dark:text-orchard-500',
  bad: 'text-status-blocked',
  warning: 'text-status-progress',
}

/**
 * Owner /today stat tile — label, value, optional delta-vs-yesterday strip,
 * sparkline placeholder. Plain visual; the parent provides numbers.
 */
export function StatCard({
  label,
  value,
  loading = false,
  sub,
  delta,
  series,
  tone = 'neutral',
  to,
  ariaLabel,
}: {
  label: string
  value: number | null
  loading?: boolean
  sub?: string | null
  delta?: { dir: 'up' | 'down' | 'flat'; copy: string } | null
  series?: number[]
  tone?: StatTone
  to?: { to: string; search?: unknown }
  ariaLabel?: string
}) {
  const inner = (
    <>
      <p className="text-[11px] font-medium uppercase tracking-[0.3px] text-fg-muted">{label}</p>
      {loading || value === null ? (
        <div className="mt-2 h-8 w-20 animate-pulse rounded bg-surface-1" />
      ) : (
        <p
          className={cn(
            'mt-2 text-[32px] font-semibold leading-none tabular-nums',
            valueToneClass[tone],
          )}
        >
          {value}
        </p>
      )}
      {delta ? (
        <DeltaStrip dir={delta.dir} copy={delta.copy} />
      ) : sub ? (
        <p className="mt-1.5 text-[11px] text-fg-faint">{sub}</p>
      ) : null}
      <Sparkline series={series} tone={tone} />
    </>
  )

  if (!to) {
    return (
      <div
        aria-label={ariaLabel}
        className="rounded-xl border border-border bg-surface-0 p-4 transition hover:border-border-strong"
      >
        {inner}
      </div>
    )
  }

  return (
    <Link
      to={to.to as never}
      search={to.search as never}
      aria-label={ariaLabel}
      className="block rounded-xl border border-border bg-surface-0 p-4 transition hover:border-border-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orchard-500"
    >
      {inner}
    </Link>
  )
}

function DeltaStrip({ dir, copy }: { dir: 'up' | 'down' | 'flat'; copy: string }) {
  const Icon = dir === 'up' ? ChevronUp : dir === 'down' ? ChevronDown : null
  const cls = dir === 'flat' ? 'text-fg-faint' : dir === 'up' ? 'text-status-done' : 'text-status-blocked'
  return (
    <p className={cn('mt-1.5 inline-flex items-center gap-0.5 text-[12px] font-medium', cls)}>
      {Icon ? <Icon className="h-3 w-3" strokeWidth={2.5} aria-hidden /> : null}
      <span>{copy}</span>
    </p>
  )
}

function Sparkline({ series, tone }: { series?: number[]; tone: StatTone }) {
  const points = series && series.length >= 2 ? series : [3, 4, 3, 5, 4, 6, 5]
  const max = Math.max(...points, 1)
  const min = Math.min(...points, 0)
  const span = Math.max(max - min, 1)
  const w = 80
  const h = 28
  const step = w / (points.length - 1)
  const path = points
    .map((v, i) => {
      const x = i * step
      const y = h - ((v - min) / span) * (h - 4) - 2
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
  const stroke = tone === 'bad' ? 'var(--agrova-status-blocked)' : 'var(--agrova-orchard-500)'
  return (
    <div className="mt-2" aria-hidden>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-7 w-full">
        <path d={path} fill="none" stroke={stroke} strokeWidth="1.5" strokeOpacity="0.5" />
      </svg>
    </div>
  )
}

/**
 * Decorative weather card — same dimensions as StatCard but bespoke value.
 */
export function StatCardShell({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('rounded-xl border border-border bg-surface-0 p-4', className)}>
      <p className="text-[11px] font-medium uppercase tracking-[0.3px] text-fg-muted">{label}</p>
      {children}
    </div>
  )
}
