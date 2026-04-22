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

export const Route = createFileRoute('/_owner/issues')({
  component: IssuesPage,
})

function IssuesPage() {
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
          rows={data ?? []}
          loading={isLoading}
          error={error instanceof Error ? error : null}
          onResolve={onResolve}
        />
      </div>
    </div>
  )
}
