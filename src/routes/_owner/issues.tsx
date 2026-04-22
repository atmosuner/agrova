import { t } from '@lingui/macro'
import { createFileRoute } from '@tanstack/react-router'
import { IssuesFeed } from '@/features/issues/IssuesFeed'
import { useIssuesListQuery, useIssuesRealtime } from '@/features/issues/useIssuesQuery'

export const Route = createFileRoute('/_owner/issues')({
  component: IssuesPage,
})

function IssuesPage() {
  useIssuesRealtime()
  const { data, isLoading, error } = useIssuesListQuery()

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-fg">{t`Sorunlar`}</h1>
      <p className="mt-1 text-sm text-fg-secondary">{t`Saha sorunları ve fotoğraflar.`}</p>
      <div className="mt-6">
        <IssuesFeed rows={data ?? []} loading={isLoading} error={error instanceof Error ? error : null} />
      </div>
    </div>
  )
}
