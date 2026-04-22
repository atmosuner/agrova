/* eslint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/macro'
import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMyTodayTasksQuery } from '@/features/tasks/useMyTodayTasksQuery'
import { TaskCardMobile } from '@/features/tasks/TaskCard.mobile'

export const Route = createFileRoute('/m/tasks')({
  component: MobileTasksPage,
})

function MobileTasksPage() {
  const { data, isLoading, isFetching, refetch } = useMyTodayTasksQuery()
  const queryClient = useQueryClient()
  const rows = data?.rows ?? []

  return (
    <div className="px-4 pb-6 pt-4">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-fg">{t`Bugün`}</h1>
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
      {isLoading ? <p className="text-sm text-fg-secondary">{t`Yükleniyor…`}</p> : null}
      {!isLoading && rows.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface-0 p-8 text-center">
          <p className="text-lg text-fg-secondary">{t`Bugün için görev yok`}</p>
          <p className="text-sm text-fg-faint">{t`Yeni atamalar burada listelenir.`}</p>
        </div>
      ) : null}
      <ul className="flex flex-col gap-3">
        {rows.map((task) => (
          <li key={task.id}>
            <TaskCardMobile task={task} />
          </li>
        ))}
      </ul>
    </div>
  )
}
