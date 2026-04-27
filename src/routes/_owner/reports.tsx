/* eslint-disable lingui/no-unlocalized-strings -- placeholder copy and chart legend labels */
import { msg, t } from '@lingui/macro'
import { createFileRoute } from '@tanstack/react-router'
import { Calendar, Download } from 'lucide-react'
import { i18n } from '@/lib/i18n'

export const Route = createFileRoute('/_owner/reports')({
  component: ReportsPage,
})

function ReportsPage() {
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.01em] text-fg">{t`Raporlar`}</h1>
          <p className="mt-0.5 text-[13px] text-fg-muted">
            {t`Tarih aralığı seçin, CSV indirin. Grafikler şu an örnek veri gösteriyor.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-surface-0 px-3 text-[13px] font-medium text-fg transition hover:border-border-strong"
          >
            <Calendar className="h-3.5 w-3.5 text-fg-muted" strokeWidth={1.75} aria-hidden />
            <span>{i18n._(msg`Son 30 gün`)}</span>
          </button>
          <button
            type="button"
            className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-surface-0 px-3 text-[13px] font-medium text-fg transition hover:border-border-strong"
          >
            <Download className="h-3.5 w-3.5 text-fg-muted" strokeWidth={1.75} aria-hidden />
            <span>{i18n._(msg`CSV indir`)}</span>
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-3">
        <ReportCard title={i18n._(msg`Görev Tamamlama`)} caption={i18n._(msg`Haftalık · aktiviteye göre`)}>
          <BarChartPlaceholder />
        </ReportCard>
        <ReportCard title={i18n._(msg`Sorun Kategorileri`)} caption={i18n._(msg`Son 30 gün`)}>
          <DonutChartPlaceholder />
        </ReportCard>
        <ReportCard title={i18n._(msg`Kimyasal Kullanımı`)} caption={i18n._(msg`Tarla bazında, en yoğun 5`)}>
          <UsageBars />
        </ReportCard>
      </div>

      <p className="mt-6 text-[12px] text-fg-faint">
        {t`Bu sayfa hızlı bir bakış için tasarlandı; detaylı raporlar yakında.`}
      </p>
    </div>
  )
}

function ReportCard({
  title,
  caption,
  children,
}: {
  title: string
  caption?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-border bg-surface-0">
      <header className="flex items-baseline justify-between gap-3 border-b border-border px-4 py-3">
        <h2 className="text-[13px] font-semibold text-fg">{title}</h2>
        {caption ? <span className="text-[11px] text-fg-muted">{caption}</span> : null}
      </header>
      <div className="p-4">{children}</div>
    </section>
  )
}

const BAR_DATA = [
  { label: 'Pzt', budama: 0.6, sulama: 0.3, diger: 0.1 },
  { label: 'Sal', budama: 0.5, sulama: 0.4, diger: 0.2 },
  { label: 'Çar', budama: 0.7, sulama: 0.5, diger: 0.3 },
  { label: 'Per', budama: 0.8, sulama: 0.4, diger: 0.2 },
  { label: 'Cum', budama: 0.6, sulama: 0.6, diger: 0.4 },
  { label: 'Cmt', budama: 0.4, sulama: 0.3, diger: 0.1 },
  { label: 'Paz', budama: 0.3, sulama: 0.2, diger: 0.05 },
]

function BarChartPlaceholder() {
  return (
    <div className="flex flex-col gap-3" aria-hidden>
      <div className="flex items-end justify-between gap-2 px-1" style={{ height: 120 }}>
        {BAR_DATA.map((d) => {
          const total = d.budama + d.sulama + d.diger
          return (
            <div key={d.label} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex w-full max-w-[24px] flex-col-reverse overflow-hidden rounded-[3px]" style={{ height: total * 110 }}>
                <span className="bg-orchard-500/80" style={{ height: `${(d.budama / total) * 100}%` }} />
                <span className="bg-harvest-500/80" style={{ height: `${(d.sulama / total) * 100}%` }} />
                <span className="bg-status-todo/60" style={{ height: `${(d.diger / total) * 100}%` }} />
              </div>
              <span className="text-[10px] text-fg-muted">{d.label}</span>
            </div>
          )
        })}
      </div>
      <ul className="flex flex-wrap gap-3 text-[11px] text-fg-secondary">
        <Legend swatch="bg-orchard-500" label={i18n._(msg`Budama`)} />
        <Legend swatch="bg-harvest-500" label={i18n._(msg`Sulama`)} />
        <Legend swatch="bg-status-todo" label={i18n._(msg`Diğer`)} />
      </ul>
    </div>
  )
}

function DonutChartPlaceholder() {
  const segments = [
    { label: i18n._(msg`Hastalık`), pct: 0.34, color: 'var(--agrova-status-blocked)' },
    { label: i18n._(msg`Zararlı`), pct: 0.22, color: 'var(--agrova-status-progress)' },
    { label: i18n._(msg`Su sorunu`), pct: 0.18, color: 'var(--agrova-status-todo)' },
    { label: i18n._(msg`Alet`), pct: 0.14, color: 'var(--agrova-harvest-500)' },
    { label: i18n._(msg`Diğer`), pct: 0.12, color: 'var(--agrova-fg-faint)' },
  ]
  let acc = 0
  const r = 36
  const circ = 2 * Math.PI * r
  return (
    <div className="flex items-center gap-4" aria-hidden>
      <svg viewBox="0 0 100 100" className="h-[120px] w-[120px] shrink-0 -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--agrova-surface-1)" strokeWidth="14" />
        {segments.map((s) => {
          const dash = s.pct * circ
          const offset = -acc
          acc += dash
          return (
            <circle
              key={s.label}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="14"
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={offset}
            />
          )
        })}
      </svg>
      <ul className="flex flex-1 flex-col gap-1.5 text-[12px] text-fg-secondary">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <span
                aria-hidden
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: s.color }}
              />
              <span>{s.label}</span>
            </span>
            <span className="font-mono text-[11px] tabular-nums text-fg-muted">{Math.round(s.pct * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function UsageBars() {
  const rows = [
    { field: i18n._(msg`Tarla 12 — Elma`), value: 0.92 },
    { field: i18n._(msg`Tarla 7 — Kiraz`), value: 0.74 },
    { field: i18n._(msg`Tarla 1 — Şeftali`), value: 0.51 },
    { field: i18n._(msg`Tarla 22 — Erik`), value: 0.36 },
    { field: i18n._(msg`Tarla 3 — Vişne`), value: 0.21 },
  ]
  return (
    <ul className="flex flex-col gap-2.5" aria-hidden>
      {rows.map((r) => (
        <li key={r.field}>
          <div className="mb-1 flex items-baseline justify-between text-[12px]">
            <span className="font-medium text-fg">{r.field}</span>
            <span className="font-mono text-[11px] tabular-nums text-fg-muted">{Math.round(r.value * 100)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-surface-1">
            <span
              className="block h-full rounded-full bg-orchard-500"
              style={{ width: `${r.value * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <li className="flex items-center gap-1.5">
      <span aria-hidden className={`inline-block h-2 w-2 rounded-full ${swatch}`} />
      <span>{label}</span>
    </li>
  )
}
