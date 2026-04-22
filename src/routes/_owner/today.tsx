import { msg, t } from '@lingui/macro'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { TaskDetailSheet } from '@/features/tasks/TaskDetailSheet'
import { DashboardActivityFeed } from '@/features/dashboard/DashboardActivityFeed'
import { TodaysBoard } from '@/features/dashboard/TodaysBoard'
import { useAllFieldsForMap } from '@/features/dashboard/use-all-fields-for-map'
import { useDashboardStats } from '@/features/dashboard/use-dashboard-stats'
import { useOperationSettings } from '@/features/settings/use-operation-settings'
import { tasksSearchDueOn, type TasksSearchState } from '@/features/tasks/tasks-search'
import { useWeather, weatherCodeLabelTr, type WeatherData } from '@/features/weather/use-weather'
import { todayISODateInIstanbul } from '@/lib/date-istanbul'
import { i18n } from '@/lib/i18n'
import { openMeteoGeocodeCity, TURKEY_VIEW_CENTER } from '@/lib/open-meteo-geocoding'
import { cn } from '@/lib/utils'

const MiniFieldsMap = lazy(() =>
  import('@/features/dashboard/MiniFieldsMap').then((m) => ({ default: m.MiniFieldsMap })),
)

export const Route = createFileRoute('/_owner/today')({
  component: TodayPage,
})

/* eslint-disable lingui/no-unlocalized-strings -- Open-Meteo numeric output + units */
function TodayWeatherBlock({ weather }: { weather: WeatherData }) {
  return (
    <div className="mt-2 text-fg">
      <div className="text-2xl font-semibold tabular-nums">{Math.round(weather.currentTemp)}°C</div>
      <p className="text-xs text-fg-secondary">
        {weatherCodeLabelTr(weather.code)} · {i18n._(msg`Hissedilen`)} {Math.round(weather.feelsLike)}°C
      </p>
      <p className="text-xs text-fg-muted">
        ↑ {Math.round(weather.high)}° ↓ {Math.round(weather.low)}°
      </p>
    </div>
  )
}
/* eslint-enable lingui/no-unlocalized-strings */

function TodayPage() {
  const navigate = useNavigate()
  const { settings } = useOperationSettings()
  const { data, isLoading } = useDashboardStats()
  const { data: allFields, isLoading: fieldsLoading } = useAllFieldsForMap()
  const city = settings?.weather_city?.trim() ?? ''
  const { data: weather, isLoading: wxLoading } = useWeather(city || null)
  const [mapCenter, setMapCenter] = useState({ ...TURKEY_VIEW_CENTER, zoom: 6 })
  const [detailTask, setDetailTask] = useState<string | null>(null)
  const today = todayISODateInIstanbul()
  const activeSet = useMemo(
    () => new Set((data?.activeFieldIds ?? []).filter(Boolean) as string[]),
    [data?.activeFieldIds],
  )

  useEffect(() => {
    if (!city) {
      return
    }
    void (async () => {
      const c = await openMeteoGeocodeCity(city)
      if (c) {
        setMapCenter({ ...c, zoom: 12 })
      }
    })()
  }, [city])

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-fg">{t`Today`}</h1>
      <p className="mt-1 text-fg-secondary">{i18n._(msg`Özet — görevler, sorunlar ve tarlalar.`)}</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={i18n._(msg`Open tasks (today)`)}
          value={isLoading ? null : data?.openTasksToday ?? 0}
          sub={
            !isLoading && data != null
              ? `${String(data.activeFieldsToday)} ${i18n._(msg`tarlada dağılmış`)}`
              : null
          }
          target={{ to: '/tasks', search: tasksSearchDueOn(today) }}
        />
        <StatCard
          title={i18n._(msg`Open issues`)}
          value={isLoading ? null : data?.openIssues ?? 0}
          target={{ to: '/issues', search: { list: 'open', highlight: undefined } }}
        />
        <StatCard
          title={i18n._(msg`Active fields (today)`)}
          value={isLoading ? null : data?.activeFieldsToday ?? 0}
          target={{ to: '/fields' }}
        />
        <div
          className={cn(
            'flex flex-col rounded-xl border border-border bg-surface-0 p-4 shadow-sm',
            !city && 'opacity-80',
          )}
        >
          <div className="text-xs font-medium text-fg-secondary">{i18n._(msg`Weather`)}</div>
          {wxLoading || !city ? (
            <div className="mt-2 h-10 animate-pulse rounded bg-surface-1" />
          ) : weather ? (
            <TodayWeatherBlock weather={weather} />
          ) : (
            <p className="mt-2 text-sm text-fg-secondary">{t`Open-Meteo verisi yok. Şehri Ayarlar’da kontrol edin.`}</p>
          )}
          <Link to="/settings" className="mt-2 text-xs font-medium text-orchard-600 hover:underline">
            {t`Settings → city`}
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr,22rem]">
        <TodaysBoard
          onOpenTask={(id) => {
            setDetailTask(id)
          }}
        />
        <div className="space-y-4">
          {fieldsLoading ? (
            <div className="h-64 animate-pulse rounded-xl bg-surface-1" />
          ) : (
            <Suspense
              fallback={<div className="h-64 animate-pulse rounded-xl border border-border bg-surface-1" />}
            >
              <MiniFieldsMap
                center={mapCenter}
                fields={allFields ?? []}
                activeFieldIds={activeSet}
                onFieldClick={() => {
                  void navigate({ to: '/fields' })
                }}
              />
            </Suspense>
          )}
          <DashboardActivityFeed />
        </div>
      </div>
      <TaskDetailSheet
        taskId={detailTask}
        onClose={() => {
          setDetailTask(null)
        }}
      />
    </div>
  )
}

type StatTarget =
  | { to: '/tasks'; search: TasksSearchState }
  | { to: '/issues'; search: { list: 'open' | 'all'; highlight: string | undefined } }
  | { to: '/fields' }

function StatCard({
  title,
  value,
  sub,
  target,
}: {
  title: string
  value: number | null
  sub?: string | null
  target: StatTarget
}) {
  const inner = (
    <>
      <div className="text-xs font-medium text-fg-secondary">{title}</div>
      {value === null ? (
        <div className="mt-2 h-9 w-20 animate-pulse rounded bg-surface-1" />
      ) : (
        <div className="mt-2 text-3xl font-semibold tabular-nums text-fg">{String(value)}</div>
      )}
      {sub ? <p className="mt-1 text-[11px] text-fg-muted">{sub}</p> : null}
    </>
  )
  if (target.to === '/fields') {
    return <Link to="/fields" className="block rounded-xl border border-border bg-surface-0 p-4 shadow-sm transition hover:bg-orchard-50/40">{inner}</Link>
  }
  if (target.to === '/issues') {
    return (
      <Link
        to="/issues"
        search={target.search}
        className="block rounded-xl border border-border bg-surface-0 p-4 shadow-sm transition hover:bg-orchard-50/40"
      >
        {inner}
      </Link>
    )
  }
  return (
    <Link
      to="/tasks"
      search={target.search}
      className="block rounded-xl border border-border bg-surface-0 p-4 shadow-sm transition hover:bg-orchard-50/40"
    >
      {inner}
    </Link>
  )
}
