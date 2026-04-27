import { msg, t } from '@lingui/macro'
import { formatShortTr } from '@/lib/format-relative-tr'
import { useActivityFeed } from '@/features/dashboard/use-activity-feed'
import { i18n } from '@/lib/i18n'

function actionLine(action: string): string {
  const m: Record<string, () => string> = {
    'task.created': () => i18n._(msg`Görev oluşturuldu`),
    'task.reassigned': () => i18n._(msg`Görev aktarıldı`),
    'task.started': () => i18n._(msg`Görev başlatıldı`),
    'task.done': () => i18n._(msg`Görev bitti`),
    'task.blocked': () => i18n._(msg`Görev bloke edildi`),
    'task.duplicated': () => i18n._(msg`Görev kopyalandı`),
    'issue.reported': () => i18n._(msg`Sorun raporu`),
    'issue.resolved': () => i18n._(msg`Sorun kapatıldı`),
  }
  return m[action]?.() ?? action
}

/* eslint-disable lingui/no-unlocalized-strings -- event type prefixes */
function dotColor(action: string): string {
  if (action.startsWith('issue.')) return 'bg-status-blocked'
  if (action === 'task.done') return 'bg-status-done'
  return 'bg-orchard-500'
}
/* eslint-enable lingui/no-unlocalized-strings */

const SENTINEL = '00000000-0000-4000-8000-000000000001'

export function DashboardActivityFeed() {
  const { data, isLoading } = useActivityFeed()
  const rows = data ?? []

  return (
    <section className="rounded-xl border border-border bg-surface-0 p-5" aria-label={i18n._(msg`Son olaylar`)}>
      <h2 className="text-sm font-semibold text-fg">{i18n._(msg`Aktivite`)}</h2>
      {isLoading ? (
        <ul className="mt-3 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className="h-10 animate-pulse rounded bg-surface-1" />
          ))}
        </ul>
      ) : rows.length === 0 ? (
        <p className="mt-2 text-sm text-fg-secondary">{t`Henüz kayıt yok.`}</p>
      ) : (
        <ul className="mt-2 max-h-64 space-y-0 overflow-y-auto">
          {rows.map((r) => {
            const actorName =
              r.actor?.id === SENTINEL ? i18n._(msg`Kaldırılmış kullanıcı`) : (r.actor?.full_name ?? '—')
            return (
              <li key={r.id} className="flex items-start gap-2.5 border-b border-border/40 py-2.5 last:border-0">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dotColor(r.action)}`} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-fg">
                    {actorName}. {actionLine(r.action)}
                  </p>
                </div>
                <span className="shrink-0 text-[11px] tabular-nums text-fg-muted">
                  {formatShortTr(new Date(r.created_at))}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
