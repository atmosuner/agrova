import { msg, t } from '@lingui/macro'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { TaskDetailSheet } from '@/features/tasks/TaskDetailSheet'
import { DashboardActivityFeed } from '@/features/dashboard/DashboardActivityFeed'
import { StatCard, StatCardShell } from '@/features/dashboard/StatCard'
import { TodaysBoard } from '@/features/dashboard/TodaysBoard'
import { useAllFieldsForMap } from '@/features/dashboard/use-all-fields-for-map'
import { useDashboardStats } from '@/features/dashboard/use-dashboard-stats'
import { useOperationSettings } from '@/features/settings/use-operation-settings'
import { tasksSearchDueOn } from '@/features/tasks/tasks-search'
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
      <div className="text-[28px] font-semibold leading-none tabular-nums">{Math.round(weather.currentTemp)}°C</div>
      <p className="mt-1 text-xs text-fg-secondary">
        {weatherCodeLabelTr(weather.code)} · ↑{Math.round(weather.high)}° ↓{Math.round(weather.low)}°
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

  /* eslint-disable lingui/no-unlocalized-strings -- internal direction tokens and numeric sign prefix */
  const buildDelta = useCallback(
    (current: number, yesterday: number, invertTone?: boolean): { dir: 'up' | 'down' | 'flat'; copy: string } => {
      const diff = current - yesterday
      if (diff === 0) return { dir: 'flat', copy: i18n._(msg`dünden aynı`) }
      const arrow: 'up' | 'down' = diff > 0 ? 'up' : 'down'
      const dir: 'up' | 'down' = invertTone ? (arrow === 'up' ? 'down' : 'up') : arrow
      const sign = diff > 0 ? '+' : ''
      return { dir, copy: i18n._(msg`${sign}${diff} dünden`) }
    },
    [],
  )
  /* eslint-enable lingui/no-unlocalized-strings */

  const tasksDelta = useMemo(
    () => (!isLoading && data ? buildDelta(data.openTasksToday, data.yesterdayOpenTasks) : null),
    [isLoading, data, buildDelta],
  )
  const issuesDelta = useMemo(
    () => (!isLoading && data ? buildDelta(data.openIssues, data.yesterdayOpenIssues, true) : null),
    [isLoading, data, buildDelta],
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
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={i18n._(msg`Açık görev (bugün)`)}
          value={isLoading ? null : data?.openTasksToday ?? 0}
          loading={isLoading}
          delta={tasksDelta}
          sub={
            !isLoading && data != null
              ? `${String(data.activeFieldsToday)} ${i18n._(msg`tarlada dağılmış`)}`
              : null
          }
          to={{ to: '/tasks', search: tasksSearchDueOn(today) }}
          ariaLabel={
            !isLoading && data
              ? `${i18n._(msg`Açık görev (bugün)`)}: ${data.openTasksToday}`
              : undefined
          }
        />
        <StatCard
          label={i18n._(msg`Açık sorunlar`)}
          value={isLoading ? null : data?.openIssues ?? 0}
          loading={isLoading}
          delta={issuesDelta}
          // eslint-disable-next-line lingui/no-unlocalized-strings -- StatTone enum literals, not copy
          tone={!isLoading && (data?.openIssues ?? 0) > 0 ? 'bad' : 'neutral'}
          to={{ to: '/issues', search: { list: 'open', highlight: undefined } }}
          ariaLabel={
            !isLoading && data
              ? `${i18n._(msg`Açık sorunlar`)}: ${data.openIssues}`
              : undefined
          }
        />
        <StatCard
          label={i18n._(msg`Aktif tarla (bugün)`)}
          value={isLoading ? null : data?.activeFieldsToday ?? 0}
          loading={isLoading}
          to={{ to: '/fields' }}
          ariaLabel={
            !isLoading && data
              ? `${i18n._(msg`Aktif tarla (bugün)`)}: ${data.activeFieldsToday}`
              : undefined
          }
        />
        <StatCardShell
          label={
            city
              ? `${i18n._(msg`Hava`)} — ${city}`
              : i18n._(msg`Hava`)
          }
          className={cn(!city && 'opacity-80')}
        >
          {wxLoading || !city ? (
            <div className="mt-2 h-10 animate-pulse rounded bg-surface-1" />
          ) : weather ? (
            <TodayWeatherBlock weather={weather} />
          ) : (
            <p className="mt-2 text-sm text-fg-secondary">
              {t`Open-Meteo verisi yok. Şehri Ayarlar’da kontrol edin.`}
            </p>
          )}
          <Link to="/settings" className="mt-2 inline-block text-[11px] font-medium text-orchard-500 hover:underline">
            {t`Ayarlar → şehir`}
          </Link>
        </StatCardShell>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-3">
          <TodaysBoard
            onOpenTask={(id) => {
              setDetailTask(id)
            }}
          />
        </div>
        <div className="flex flex-col gap-3 sm:col-span-2 lg:col-span-1">
          <section className="overflow-hidden rounded-xl border border-border bg-surface-0 p-5" aria-label={i18n._(msg`Tarla haritası`)}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-fg">{i18n._(msg`Tarla Haritası`)}</h2>
              <Link to="/fields" className="text-xs font-medium text-orchard-600 hover:underline">
                {t`Haritaya git`} →
              </Link>
            </div>
            {fieldsLoading ? (
              <div className="h-48 animate-pulse rounded-lg bg-surface-1" />
            ) : (
              <Suspense
                fallback={<div className="h-48 animate-pulse rounded-lg bg-surface-1" />}
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
          </section>
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

