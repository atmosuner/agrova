/* eslint-disable lingui/no-unlocalized-strings -- chart labels, Tailwind classes, SVG attrs */
import { msg, t } from '@lingui/macro'
import { createFileRoute } from '@tanstack/react-router'
import { format } from 'date-fns'
import { tr as dateFnsTr } from 'date-fns/locale'
import { Calendar, Download } from 'lucide-react'
import { useRef, useState } from 'react'
import { StatCard } from '@/features/dashboard/StatCard'
import {
  useReportData,
  type CategoryBucket,
  type DateRange,
  type WeekBucket,
} from '@/features/reports/useReportData'
import { CATEGORY_LABEL } from '@/features/issues/issue-labels'
import type { IssueCategory } from '@/features/issues/categories'
import { i18n } from '@/lib/i18n'
import { useOnClickOutside } from '@/lib/use-on-click-outside'

export const Route = createFileRoute('/_owner/reports')({
  component: ReportsPage,
})

const RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: 7, label: '7' },
  { value: 30, label: '30' },
  { value: 90, label: '90' },
]

function ReportsPage() {
  const [days, setDays] = useState<DateRange>(30)
  const { data, isLoading } = useReportData(days)
  const [rangeOpen, setRangeOpen] = useState(false)
  const rangeRef = useRef<HTMLDivElement>(null)
  useOnClickOutside(rangeRef, () => setRangeOpen(false))

  const kpis = data?.kpis
  const daysStr = String(days)

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative" ref={rangeRef}>
          <button
            type="button"
            onClick={() => setRangeOpen((o) => !o)}
            className="inline-flex h-[30px] items-center gap-1.5 rounded-[7px] border border-orchard-500/30 bg-orchard-50 px-2.5 text-[12px] font-medium text-orchard-700 transition-colors hover:bg-orchard-100"
            aria-expanded={rangeOpen}
            aria-haspopup="listbox"
          >
            <Calendar className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
            {t`Son ${daysStr} gün`}
            <span className="text-orchard-500" aria-hidden>▾</span>
          </button>
          {rangeOpen && (
            <div
              className="absolute left-0 z-50 mt-1 w-36 rounded-lg border border-border-strong bg-surface-0 py-1 ring-[3px] ring-[rgba(12,18,16,0.04)]"
              role="listbox"
            >
              {RANGE_OPTIONS.map((opt) => {
                const lbl = opt.label
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={days === opt.value}
                    className="flex w-full items-center px-3 py-1.5 text-left text-[13px] text-fg hover:bg-surface-1"
                    onClick={() => {
                      setDays(opt.value)
                      setRangeOpen(false)
                    }}
                  >
                    {t`Son ${lbl} gün`}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="ml-auto">
          <button
            type="button"
            className="inline-flex h-[30px] items-center gap-1.5 rounded-[7px] border border-border bg-surface-0 px-2.5 text-[12px] font-medium text-fg-secondary transition-colors hover:border-border-strong hover:text-fg"
            onClick={() => {
              if (!data) return
              downloadCsv(data)
            }}
          >
            <Download className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
            {i18n._(msg`CSV indir`)}
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={i18n._(msg`Toplam görev`)}
          value={kpis?.totalTasks ?? null}
          loading={isLoading}
          tone="neutral"
        />
        <StatCard
          label={i18n._(msg`Tamamlanma`)}
          value={kpis?.completionRate ?? null}
          loading={isLoading}
          sub={kpis ? `${kpis.completedTasks} / ${kpis.totalTasks}` : null}
          tone={kpis && kpis.completionRate >= 70 ? 'good' : kpis && kpis.completionRate >= 40 ? 'warning' : 'bad'}
        />
        <StatCard
          label={i18n._(msg`Açık sorunlar`)}
          value={kpis?.openIssues ?? null}
          loading={isLoading}
          tone={kpis && kpis.openIssues === 0 ? 'good' : kpis && kpis.openIssues <= 3 ? 'warning' : 'bad'}
        />
        <StatCard
          label={i18n._(msg`Ort. çözüm süresi`)}
          value={kpis?.avgResolutionDays ?? null}
          loading={isLoading}
          sub={kpis?.avgResolutionDays != null ? i18n._(msg`gün`) : '\u2014'}
          tone="neutral"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ReportCard title={i18n._(msg`Haftalık görev durumu`)} caption={t`Son ${daysStr} gün`}>
          {isLoading ? <ChartSkeleton /> : <WeeklyChart buckets={data?.weeklyTasks ?? []} />}
        </ReportCard>
        <ReportCard title={i18n._(msg`Sorun kategorileri`)} caption={t`Son ${daysStr} gün`}>
          {isLoading ? <ChartSkeleton /> : <DonutChart buckets={data?.issuesByCategory ?? []} />}
        </ReportCard>
        <ReportCard title={i18n._(msg`Tarla bazında görevler`)} caption={i18n._(msg`En yoğun 5`)}>
          {isLoading ? <ChartSkeleton /> : <HorizontalBars items={data?.tasksByField ?? []} labelKey="fieldName" valueKey="count" />}
        </ReportCard>
        <ReportCard title={i18n._(msg`Çalışan verimliliği`)} caption={i18n._(msg`Tamamlanan görev sayısı`)}>
          {isLoading ? <ChartSkeleton /> : <HorizontalBars items={data?.tasksByWorker ?? []} labelKey="personName" valueKey="completed" />}
        </ReportCard>
      </div>
    </div>
  )
}

/* ─── Shared card chrome ─── */

function ReportCard({ title, caption, children }: { title: string; caption?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-surface-0">
      <header className="flex items-baseline justify-between gap-3 border-b border-border px-5 py-3">
        <h2 className="text-sm font-semibold text-fg">{title}</h2>
        {caption ? <span className="text-[11px] text-fg-muted">{caption}</span> : null}
      </header>
      <div className="p-5">{children}</div>
    </section>
  )
}

function ChartSkeleton() {
  return <div className="h-40 animate-pulse rounded-lg bg-surface-1" />
}

/* ─── Weekly stacked bar chart ─── */

function WeeklyChart({ buckets }: { buckets: WeekBucket[] }) {
  if (buckets.length === 0) {
    return <p className="py-8 text-center text-sm text-fg-muted">{t`Veri yok`}</p>
  }

  const maxVal = Math.max(...buckets.map((b) => b.done + b.inProgress + b.other), 1)

  return (
    <div className="flex flex-col gap-3" aria-hidden>
      <div className="flex items-end justify-between gap-2 px-1" style={{ height: 140 }}>
        {buckets.map((b) => {
          const total = b.done + b.inProgress + b.other
          const h = (total / maxVal) * 130
          const doneH = total > 0 ? (b.done / total) * 100 : 0
          const progH = total > 0 ? (b.inProgress / total) * 100 : 0
          const otherH = total > 0 ? (b.other / total) * 100 : 0
          const label = formatWeekLabel(b.week)
          return (
            <div key={b.week} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className="flex w-full max-w-[28px] flex-col-reverse overflow-hidden rounded-[3px]"
                style={{ height: Math.max(h, 2) }}
                title={`${label}: ${b.done} ${i18n._(msg`tamamlandı`)}, ${b.inProgress} ${i18n._(msg`sürüyor`)}, ${b.other} ${i18n._(msg`diğer`)}`}
              >
                <span className="bg-orchard-500" style={{ height: `${doneH}%` }} />
                <span className="bg-harvest-500" style={{ height: `${progH}%` }} />
                <span className="bg-sky-400/60" style={{ height: `${otherH}%` }} />
              </div>
              <span className="text-[10px] text-fg-muted">{label}</span>
            </div>
          )
        })}
      </div>
      <ul className="flex flex-wrap gap-3 text-[11px] text-fg-secondary">
        <Legend swatch="bg-orchard-500" label={i18n._(msg`Tamamlandı`)} />
        <Legend swatch="bg-harvest-500" label={i18n._(msg`Sürüyor`)} />
        <Legend swatch="bg-sky-400/60" label={i18n._(msg`Diğer`)} />
      </ul>
    </div>
  )
}

function formatWeekLabel(isoDate: string): string {
  try {
    return format(new Date(isoDate), 'd MMM', { locale: dateFnsTr })
  } catch {
    return isoDate.slice(5)
  }
}

/* ─── Donut chart ─── */

const DONUT_COLORS = [
  'var(--agrova-status-blocked)',
  'var(--agrova-orchard-500)',
  'var(--agrova-harvest-500)',
  'var(--agrova-status-todo)',
  'var(--agrova-status-progress)',
  'var(--agrova-fg-faint)',
  'var(--agrova-fg-muted)',
]

function DonutChart({ buckets }: { buckets: CategoryBucket[] }) {
  if (buckets.length === 0) {
    return <p className="py-8 text-center text-sm text-fg-muted">{t`Veri yok`}</p>
  }

  const total = buckets.reduce((s, b) => s + b.count, 0)
  const r = 36
  const circ = 2 * Math.PI * r

  const segments = buckets.map((b) => {
    const pct = total > 0 ? b.count / total : 0
    return { ...b, dash: pct * circ }
  })
  const offsets: number[] = []
  let running = 0
  for (const s of segments) {
    offsets.push(-running)
    running += s.dash
  }

  return (
    <div className="flex items-center gap-6" aria-hidden>
      <svg viewBox="0 0 100 100" className="h-[130px] w-[130px] shrink-0 -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--agrova-surface-1)" strokeWidth="14" />
        {segments.map((s, idx) => (
          <circle
            key={s.category}
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={DONUT_COLORS[idx % DONUT_COLORS.length]}
            strokeWidth="14"
            strokeDasharray={`${s.dash} ${circ - s.dash}`}
            strokeDashoffset={offsets[idx]}
          />
        ))}
      </svg>
      <ul className="flex flex-1 flex-col gap-1.5 text-[12px] text-fg-secondary">
        {buckets.map((b, idx) => {
          const pct = total > 0 ? Math.round((b.count / total) * 100) : 0
          const label = CATEGORY_LABEL[b.category as IssueCategory]
            ? i18n._(CATEGORY_LABEL[b.category as IssueCategory])
            : b.category
          return (
            <li key={b.category} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: DONUT_COLORS[idx % DONUT_COLORS.length] }}
                />
                <span>{label}</span>
              </span>
              <span className="font-mono text-[11px] tabular-nums text-fg-muted">{pct}%</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/* ─── Horizontal bar chart (reusable for fields + workers) ─── */

function HorizontalBars<T extends Record<string, unknown>>({
  items,
  labelKey,
  valueKey,
}: {
  items: T[]
  labelKey: keyof T & string
  valueKey: keyof T & string
}) {
  if (items.length === 0) {
    return <p className="py-8 text-center text-sm text-fg-muted">{t`Veri yok`}</p>
  }

  const maxVal = Math.max(...items.map((i) => Number(i[valueKey])), 1)

  return (
    <ul className="flex flex-col gap-2.5" aria-hidden>
      {items.map((item, idx) => {
        const label = String(item[labelKey])
        const value = Number(item[valueKey])
        const pct = (value / maxVal) * 100
        return (
          <li key={idx}>
            <div className="mb-1 flex items-baseline justify-between text-[12px]">
              <span className="truncate font-medium text-fg">{label}</span>
              <span className="ml-2 shrink-0 font-mono text-[11px] tabular-nums text-fg-muted">{value}</span>
            </div>
            <div className="h-1.5 rounded-full bg-surface-1">
              <span className="block h-full rounded-full bg-orchard-500" style={{ width: `${pct}%` }} />
            </div>
          </li>
        )
      })}
    </ul>
  )
}

/* ─── Shared chart helpers ─── */

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <li className="flex items-center gap-1.5">
      <span aria-hidden className={`inline-block h-2 w-2 rounded-full ${swatch}`} />
      <span>{label}</span>
    </li>
  )
}

/* ─── CSV export ─── */

function downloadCsv(data: NonNullable<ReturnType<typeof useReportData>['data']>) {
  const lines: string[] = []
  lines.push('Metric,Value')
  lines.push(`Total Tasks,${data.kpis.totalTasks}`)
  lines.push(`Completed Tasks,${data.kpis.completedTasks}`)
  lines.push(`Completion Rate,${data.kpis.completionRate}%`)
  lines.push(`Open Issues,${data.kpis.openIssues}`)
  lines.push(`Avg Resolution Days,${data.kpis.avgResolutionDays ?? 'N/A'}`)
  lines.push('')
  lines.push('Week,Done,In Progress,Other')
  for (const w of data.weeklyTasks) {
    lines.push(`${w.week},${w.done},${w.inProgress},${w.other}`)
  }
  lines.push('')
  lines.push('Issue Category,Count')
  for (const c of data.issuesByCategory) {
    lines.push(`${c.category},${c.count}`)
  }
  lines.push('')
  lines.push('Field,Tasks')
  for (const f of data.tasksByField) {
    lines.push(`${f.fieldName},${f.count}`)
  }
  lines.push('')
  lines.push('Worker,Completed')
  for (const p of data.tasksByWorker) {
    lines.push(`${p.personName},${p.completed}`)
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `agrova-report-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
