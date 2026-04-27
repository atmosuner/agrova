/* eslint-disable lingui/no-unlocalized-strings -- TanStack Query + URL keys */
import { t } from '@lingui/macro'
import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useId, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { FilterBar } from '@/features/tasks/FilterBar'
import { TaskCreateModal } from '@/features/tasks/TaskCreateModal'
import { TaskDetailSheet } from '@/features/tasks/TaskDetailSheet'
import { TasksKanban } from '@/features/tasks/TasksKanban'
import { parseTasksSearch, type TasksSearchState } from '@/features/tasks/tasks-search'
import { TasksTable } from '@/features/tasks/TasksTable'
import { TASKS_PAGE_SIZE, useTasksQuery } from '@/features/tasks/useTasksQuery'
import { useAssignablePeopleQuery } from '@/features/tasks/useAssignablePeopleQuery'
import { useFieldsQuery } from '@/features/tasks/useFieldsQuery'

export const Route = createFileRoute('/_owner/tasks')({
  validateSearch: (s: Record<string, unknown>) => parseTasksSearch(s),
  component: TasksPage,
})

function TasksPage() {
  const queryClient = useQueryClient()
  const search = Route.useSearch() as TasksSearchState
  const navigate = Route.useNavigate()
  const [createOpen, setCreateOpen] = useState(false)
  const headingId = useId()

  const { data: listData, isLoading, error: listError } = useTasksQuery({ search })
  const { data: fieldOpts = [] } = useFieldsQuery()
  const { data: peopleOpts = [] } = useAssignablePeopleQuery()

  const totalPages = useMemo(() => {
    const n = listData?.total ?? 0
    return Math.max(1, Math.ceil(n / TASKS_PAGE_SIZE) || 1)
  }, [listData?.total])
  const page = Math.min(search.page, totalPages - 1)

  useEffect(() => {
    if (listData == null) {
      return
    }
    const maxPage = Math.max(0, Math.ceil(listData.total / TASKS_PAGE_SIZE) - 1)
    if (listData.total > 0 && search.page > maxPage) {
      void navigate({ to: '/tasks', search: { ...search, page: 0 } })
    }
  }, [listData, navigate, search, search.page])

  function patchSearch(partial: Partial<TasksSearchState>) {
    void navigate({ to: '/tasks', search: { ...search, ...partial } })
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 id={headingId} className="text-2xl font-semibold tracking-tight text-fg">
            {t`Görevler`}
          </h1>
          <p className="mt-1 text-fg-secondary">{t`Tarlalar genelinde iş planla ve ata.`}</p>
        </div>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          {t`Yeni görev`}
        </Button>
      </div>

      <FilterBar
        search={search}
        fieldOpts={fieldOpts}
        peopleOpts={peopleOpts}
        onPatch={patchSearch}
      />

      {listError ? (
        <p className="text-sm text-red-600 dark:text-red-400">{listError.message}</p>
      ) : null}
      {isLoading ? <p className="text-sm text-fg-secondary">{t`Görevler yükleniyor…`}</p> : null}
      {!isLoading && !listError && search.view === 'table' ? (
        <TasksTable
          rows={listData?.rows ?? []}
          onRowClick={(id) => patchSearch({ task: id })}
        />
      ) : null}
      {!isLoading && !listError && search.view === 'kanban' ? (
        <TasksKanban rows={listData?.rows ?? []} onCardClick={(id) => patchSearch({ task: id })} />
      ) : null}

      {listData && !isLoading && listData.total > 0 && search.view === 'table' ? (
        <div className="mt-3 flex items-center justify-between gap-2 text-sm text-fg-secondary">
          <span>
            {t`Toplam`}: {listData.total} · {t`Sayfa`} {page + 1} / {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 0}
              onClick={() => patchSearch({ page: page - 1 })}
            >
              {t`Önceki`}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => patchSearch({ page: page + 1 })}
            >
              {t`Sonraki`}
            </Button>
          </div>
        </div>
      ) : null}

      <TaskCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          void queryClient.invalidateQueries({ queryKey: ['tasks'] })
        }}
      />

      <TaskDetailSheet
        taskId={search.task}
        onClose={() => void navigate({ to: '/tasks', search: { ...search, task: null } })}
      />
    </div>
  )
}
