import { msg, t } from '@lingui/macro'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useDashboardStats } from '@/features/dashboard/use-dashboard-stats'
import { defaultTasksSearch, type TasksSearchState } from '@/features/tasks/tasks-search'
import { i18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_owner/today')({
  component: TodayPage,
})

function TodayPage() {
  const { data, isLoading } = useDashboardStats()

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-fg">{t`Today`}</h1>
      <p className="mt-1 text-fg-secondary">{i18n._(msg`Özet — görevler, sorunlar ve tarlalar.`)}</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={i18n._(msg`Open tasks (today)`)}
          value={isLoading ? '…' : String(data?.openTasksToday ?? 0)}
          to="/tasks"
          search={defaultTasksSearch()}
        />
        <StatCard
          title={i18n._(msg`Open issues`)}
          value={isLoading ? '…' : String(data?.openIssues ?? 0)}
          to="/issues"
        />
        <StatCard
          title={i18n._(msg`Active fields (today)`)}
          value={isLoading ? '…' : String(data?.activeFieldsToday ?? 0)}
          to="/fields"
        />
        <Link
          to="/settings"
          className={cn(
            'rounded-xl border border-border bg-surface-0 p-4 shadow-sm transition hover:bg-orchard-50/40',
          )}
        >
          <div className="text-xs font-medium text-fg-secondary">{i18n._(msg`Weather`)}</div>
          <p className="mt-2 text-sm text-fg-secondary">{i18n._(msg`City in Settings → Open-Meteo on map later (M7).`)}</p>
        </Link>
      </div>
    </div>
  )
}

function StatCard({ title, value, to, search }: { title: string; value: string; to: string; search?: TasksSearchState }) {
  const inner = (
    <>
      <div className="text-xs font-medium text-fg-secondary">{title}</div>
      <div className="mt-2 text-3xl font-semibold tabular-nums text-fg">{value}</div>
    </>
  )
  if (search) {
    return (
      <Link
        to={to}
        search={search}
        className={cn(
          'block rounded-xl border border-border bg-surface-0 p-4 shadow-sm transition hover:bg-orchard-50/40',
        )}
      >
        {inner}
      </Link>
    )
  }
  return (
    <Link
      to={to}
      className={cn(
        'block rounded-xl border border-border bg-surface-0 p-4 shadow-sm transition hover:bg-orchard-50/40',
      )}
    >
      {inner}
    </Link>
  )
}
