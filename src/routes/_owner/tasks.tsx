/* eslint-disable lingui/no-unlocalized-strings -- TanStack Query + URL keys */
import { msg, t } from '@lingui/macro'
import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useId, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ACTIVITY_IDS, ACTIVITY_LABEL, activityDbValue } from '@/features/tasks/activities'
import { TaskCreateModal } from '@/features/tasks/TaskCreateModal'
import { TaskDetailSheet } from '@/features/tasks/TaskDetailSheet'
import { TasksKanban } from '@/features/tasks/TasksKanban'
import { parseTasksSearch, type TasksSearchState } from '@/features/tasks/tasks-search'
import { TasksTable } from '@/features/tasks/TasksTable'
import { TASKS_PAGE_SIZE, useTasksQuery } from '@/features/tasks/useTasksQuery'
import { useAssignablePeopleQuery } from '@/features/tasks/useAssignablePeopleQuery'
import { useFieldsQuery } from '@/features/tasks/useFieldsQuery'
import { i18n } from '@/lib/i18n'
import type { Enums } from '@/types/db'

const STATUSES: Enums<'task_status'>[] = ['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED', 'CANCELLED']

function statusTr(s: Enums<'task_status'>): string {
  const m = {
    TODO: msg`Yapılacak`,
    IN_PROGRESS: msg`Sürüyor`,
    DONE: msg`Bitti`,
    BLOCKED: msg`Bloke`,
    CANCELLED: msg`İptal`,
  } as const
  return i18n._(m[s])
}

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
            {t`Tasks`}
          </h1>
          <p className="mt-1 text-fg-secondary">{t`Plan and assign work across fields.`}</p>
        </div>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          {t`Yeni görev`}
        </Button>
      </div>

      <div className="mb-4 flex flex-col gap-3 rounded-lg border border-border bg-surface-0 p-3">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <label className="flex flex-col gap-0.5 text-xs font-medium text-fg-secondary">
            {t`Durum`}
            <select
              className="rounded-md border border-border bg-surface-1 px-2 py-1.5 text-sm text-fg"
              value={search.status ?? ''}
              onChange={(e) => {
                const v = e.target.value
                void navigate({
                  to: '/tasks',
                  search: { ...search, status: v ? (v as Enums<'task_status'>) : null, page: 0 },
                })
              }}
            >
              <option value="">{i18n._(msg`Tümü`)}</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {statusTr(s)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-0.5 text-xs font-medium text-fg-secondary">
            {t`Tarla`}
            <select
              className="rounded-md border border-border bg-surface-1 px-2 py-1.5 text-sm text-fg"
              value={search.field ?? ''}
              onChange={(e) => {
                const v = e.target.value
                void navigate({ to: '/tasks', search: { ...search, field: v || null, page: 0 } })
              }}
            >
              <option value="">{i18n._(msg`Tümü`)}</option>
              {fieldOpts.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-0.5 text-xs font-medium text-fg-secondary">
            {t`Kime`}
            <select
              className="rounded-md border border-border bg-surface-1 px-2 py-1.5 text-sm text-fg"
              value={search.assignee ?? ''}
              onChange={(e) => {
                const v = e.target.value
                void navigate({ to: '/tasks', search: { ...search, assignee: v || null, page: 0 } })
              }}
            >
              <option value="">{i18n._(msg`Tümü`)}</option>
              {peopleOpts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-0.5 text-xs font-medium text-fg-secondary">
            {t`Aktivite`}
            <select
              className="rounded-md border border-border bg-surface-1 px-2 py-1.5 text-sm text-fg"
              value={search.activity ?? ''}
              onChange={(e) => {
                const v = e.target.value
                void navigate({ to: '/tasks', search: { ...search, activity: v || null, page: 0 } })
              }}
            >
              <option value="">{i18n._(msg`Tümü`)}</option>
              {ACTIVITY_IDS.map((id) => {
                const val = activityDbValue(id)
                return (
                  <option key={id} value={val}>
                    {i18n._(ACTIVITY_LABEL[id])}
                  </option>
                )
              })}
            </select>
          </label>
          <label className="flex flex-col gap-0.5 text-xs font-medium text-fg-secondary">
            {t`Başlangıç`}
            <input
              type="date"
              className="rounded-md border border-border bg-surface-1 px-2 py-1.5 text-sm text-fg"
              value={search.dueFrom ?? ''}
              onChange={(e) => {
                const v = e.target.value
                void navigate({ to: '/tasks', search: { ...search, dueFrom: v || null, page: 0 } })
              }}
            />
          </label>
          <label className="flex flex-col gap-0.5 text-xs font-medium text-fg-secondary">
            {t`Bitiş`}
            <input
              type="date"
              className="rounded-md border border-border bg-surface-1 px-2 py-1.5 text-sm text-fg"
              value={search.dueTo ?? ''}
              onChange={(e) => {
                const v = e.target.value
                void navigate({ to: '/tasks', search: { ...search, dueTo: v || null, page: 0 } })
              }}
            />
          </label>
        </div>
        {search.dueFrom && search.dueTo && search.dueFrom > search.dueTo ? (
          <p className="text-sm text-amber-700 dark:text-amber-400">{t`Tarih aralığını kontrol edin.`}</p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={search.view === 'table' ? 'default' : 'outline'}
            onClick={() => void navigate({ to: '/tasks', search: { ...search, view: 'table' } })}
          >
            {t`Tablo`}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={search.view === 'kanban' ? 'default' : 'outline'}
            onClick={() => void navigate({ to: '/tasks', search: { ...search, view: 'kanban' } })}
          >
            {t`Pano`}
          </Button>
        </div>
      </div>

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
