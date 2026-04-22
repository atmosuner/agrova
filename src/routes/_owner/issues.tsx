import { t } from '@lingui/macro'
import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { IssuesFeed } from '@/features/issues/IssuesFeed'
import { resolveIssue } from '@/features/issues/resolve-issue'
import {
  issuesListQueryKey,
  type IssueListRow,
  useIssuesListQuery,
  useIssuesRealtime,
} from '@/features/issues/useIssuesQuery'
import { useMyPersonQuery } from '@/features/people/useMyPersonQuery'

function parseIssuesSearch(s: Record<string, unknown>) {
  return {
    highlight: typeof s.highlight === 'string' && s.highlight.length > 0 ? s.highlight : undefined,
    list: s.list === 'open' ? ('open' as const) : ('all' as const),
  }
}

export const Route = createFileRoute('/_owner/issues')({
  validateSearch: (s) => parseIssuesSearch(s),
  component: IssuesPage,
})

function IssuesPage() {
  const { highlight: highlightId, list } = Route.useSearch()
  const qc = useQueryClient()
  const { data: me } = useMyPersonQuery()
  useIssuesRealtime()
  const { data, isLoading, error } = useIssuesListQuery()

  const onResolve =
    me?.role === 'OWNER'
      ? async (issueId: string) => {
          const now = new Date().toISOString()
          const resolverId = me.id
          const resolverName = me.full_name
          qc.setQueryData<IssueListRow[]>(issuesListQueryKey, (prev) =>
            (prev ?? []).map((r) =>
              r.id === issueId
                ? {
                    ...r,
                    resolved_at: now,
                    resolved_by: resolverId,
                    resolver: { full_name: resolverName },
                  }
                : r,
            ),
          )
          try {
            await resolveIssue({ issueId, resolverPersonId: resolverId })
          } catch {
            await qc.invalidateQueries({ queryKey: issuesListQueryKey })
          }
        }
      : undefined

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-fg">{t`Sorunlar`}</h1>
      <p className="mt-1 text-sm text-fg-secondary">{t`Saha sorunları ve fotoğraflar.`}</p>
      <div className="mt-6">
        <IssuesFeed
          key={list}
          rows={data ?? []}
          loading={isLoading}
          error={error instanceof Error ? error : null}
          onResolve={onResolve}
          highlightId={highlightId}
          // eslint-disable-next-line lingui/no-unlocalized-strings -- internal filter keys
          defaultResolved={list === 'open' ? 'open' : 'all'}
        />
      </div>
    </div>
  )
}
