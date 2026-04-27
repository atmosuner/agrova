/* eslint-disable lingui/no-unlocalized-strings */
import { msg, t } from '@lingui/macro'
import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { ClipboardList, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMyOpenTasksQuery } from '@/features/tasks/useMyOpenTasksQuery'
import { FocusTaskCard, LaterTaskCard } from '@/features/tasks/TaskCard.mobile'
import { i18n } from '@/lib/i18n'

export const Route = createFileRoute('/m/tasks')({
  component: MobileTasksPage,
})

function MobileTasksPage() {
  const { data, isLoading, isFetching, refetch } = useMyOpenTasksQuery()
  const queryClient = useQueryClient()
  const rows = data?.rows ?? []
  const [focusTask, ...laterTasks] = rows

  return (
    <div className="pb-6">
      <div className="flex items-center justify-between gap-2 px-4 pt-4">
        <h1 className="text-xl font-semibold text-fg">{t`Yapılacak`}</h1>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label={t`Yenile`}
          onClick={async () => {
            await refetch()
            void queryClient.invalidateQueries({ queryKey: ['me', 'person'] })
          }}
          disabled={isFetching}
        >
          <RefreshCw className={isFetching ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
        </Button>
      </div>

      {isLoading ? <FocusSkeleton /> : null}

      {!isLoading && rows.length === 0 ? <EmptyState /> : null}

      {focusTask ? (
        <div className="px-4 pt-4">
          <FocusTaskCard
            task={focusTask}
            primaryLabel={focusTask.status === 'IN_PROGRESS' ? i18n._(msg`Bitir`) : i18n._(msg`Başla`)}
          />
        </div>
      ) : null}

      {laterTasks.length > 0 ? (
        <section className="mt-6 px-4">
          <p className="mb-2 px-0.5 text-[11px] font-medium uppercase tracking-[0.5px] text-fg-faint">
            {i18n._(msg`Bugün daha`)}
          </p>
          <ul className="flex flex-col gap-2">
            {laterTasks.map((task) => (
              <li key={task.id}>
                <LaterTaskCard task={task} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}

function FocusSkeleton() {
  return (
    <div className="px-4 pt-4">
      <div className="rounded-[20px] border border-border bg-surface-0 p-5">
        <div className="h-3 w-24 animate-pulse rounded bg-surface-1" />
        <div className="mt-4 h-24 w-24 animate-pulse rounded-3xl bg-surface-1" />
        <div className="mt-4 h-7 w-40 animate-pulse rounded bg-surface-1" />
        <div className="mt-2 h-4 w-32 animate-pulse rounded bg-surface-1" />
        <div className="mt-5 h-[72px] w-full animate-pulse rounded-full bg-surface-1" />
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="mx-4 mt-8 flex flex-col items-center gap-2 rounded-[20px] border border-dashed border-border bg-surface-0 p-8 text-center">
      <span aria-hidden className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-orchard-50">
        <ClipboardList className="h-7 w-7 text-orchard-500" strokeWidth={1.75} />
      </span>
      <p className="mt-1 text-lg font-medium text-fg">{t`Açık görev yok`}</p>
      <p className="text-sm text-fg-faint">{t`Size atanan veya üzerinizdeki işler burada listelenir.`}</p>
    </div>
  )
}
