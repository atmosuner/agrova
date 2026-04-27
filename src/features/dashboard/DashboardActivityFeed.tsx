import { msg, t } from '@lingui/macro'
import { formatShortTr } from '@/lib/format-relative-tr'
import { useActivityFeed } from '@/features/dashboard/use-activity-feed'
import { i18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

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

const SENTINEL = '00000000-0000-4000-8000-000000000001'

export function DashboardActivityFeed() {
  const { data, isLoading } = useActivityFeed()
  const rows = data ?? []

  return (
    <section className="rounded-xl border border-border bg-surface-0 p-4" aria-label={i18n._(msg`Son olaylar`)}>
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
        <ul className="mt-2 max-h-80 space-y-2 overflow-y-auto text-sm">
          {rows.map((r) => {
            const actorName =
              r.actor?.id === SENTINEL ? i18n._(msg`Kaldırılmış kullanıcı`) : (r.actor?.full_name ?? '—')
            return (
              <li key={r.id} className="border-b border-border/60 pb-2 last:border-0">
                <div className="font-medium text-fg">{actionLine(r.action)}</div>
                <div className={cn('text-xs text-fg-secondary')}>
                  {actorName} · {formatShortTr(new Date(r.created_at))}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
