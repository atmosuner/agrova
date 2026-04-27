import { msg, t } from '@lingui/macro'
import { Link } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { Bell } from 'lucide-react'
import { useOnClickOutside } from '@/lib/use-on-click-outside'
import { i18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { inboxRowToIssueHighlight, inboxRowToTaskLink } from '@/features/notifications/notification-href'
import { useNotificationsInbox } from '@/features/notifications/use-notifications-inbox'
import { formatShortTr } from '@/lib/format-relative-tr'

function actionSummary(action: string): string {
  const map: Record<string, () => string> = {
    'issue.reported': () => i18n._(msg`Yeni sorun raporu`),
    'issue.resolved': () => i18n._(msg`Sorun kapatıldı`),
    'task.created': () => i18n._(msg`Görev oluşturuldu`),
    'task.reassigned': () => i18n._(msg`Görev aktarıldı`),
    'task.started': () => i18n._(msg`Görev başlatıldı`),
    'task.done': () => i18n._(msg`Görev bitti`),
    'task.blocked': () => i18n._(msg`Görev bloke edildi`),
    'task.duplicated': () => i18n._(msg`Görev kopyalandı`),
  }
  return map[action]?.() ?? action
}

export function NotificationsBell() {
  const { data, isLoading, unread, markAllRead, recipientId } = useNotificationsInbox()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  useOnClickOutside(wrapRef, () => {
    setOpen(false)
  })

  if (!recipientId) {
    return null
  }

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        className={cn(
          'relative flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface-0 text-fg transition hover:bg-surface-1',
        )}
        aria-expanded={open}
        aria-label={i18n._(msg`Bildirimler`)}
        onClick={() => {
          setOpen((o) => !o)
        }}
      >
        <Bell className="h-5 w-5" aria-hidden />
        {unread > 0 ? (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-status-blocked" aria-hidden />
        ) : null}
      </button>
      {open ? (
        <div
          className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,24rem)] rounded-xl border border-border-strong bg-surface-0 p-0 ring-[3px] ring-[rgba(12,18,16,0.04)]"
          role="dialog"
          aria-label={i18n._(msg`Bildirimler`)}
        >
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="text-sm font-medium text-fg">{i18n._(msg`Bildirimler`)}</span>
            <button
              type="button"
              className="text-xs font-medium text-orchard-600 hover:underline"
              onClick={() => {
                void markAllRead.mutateAsync()
              }}
              disabled={unread === 0 || markAllRead.isPending}
            >
              {t`Hepsini okundu işaretle`}
            </button>
          </div>
          <ul className="max-h-80 overflow-y-auto py-1 text-sm">
            {isLoading ? (
              <li className="px-3 py-4 text-fg-secondary">{t`Yükleniyor…`}</li>
            ) : (data?.length ?? 0) === 0 ? (
              <li className="px-3 py-4 text-fg-secondary">{t`Bildirim yok`}</li>
            ) : (
              (data ?? []).map((row) => {
                const a = row.activity_log
                const taskLink = inboxRowToTaskLink(row)
                const issueId = inboxRowToIssueHighlight(row)
                const inner = (
                  <div
                    className={cn(
                      'block w-full border-l-2 border-transparent px-3 py-2.5 text-left',
                      !row.read_at && 'bg-orchard-50/50 dark:bg-surface-1',
                    )}
                  >
                    <div className="font-medium text-fg">{a ? actionSummary(a.action) : '—'}</div>
                    <div className="text-xs text-fg-secondary">
                      {a?.actor?.full_name ? `${a.actor.full_name} · ` : ''}
                      {a ? formatShortTr(new Date(a.created_at)) : ''}
                    </div>
                  </div>
                )
                if (taskLink) {
                  return (
                    <li key={row.id}>
                      <Link
                        to={taskLink.to}
                        search={taskLink.search}
                        className="block hover:bg-surface-1"
                        onClick={() => {
                          setOpen(false)
                        }}
                      >
                        {inner}
                      </Link>
                    </li>
                  )
                }
                if (issueId) {
                  return (
                    <li key={row.id}>
                      <Link
                        to="/issues"
                        search={{ highlight: issueId, list: 'all' }}
                        className="block hover:bg-surface-1"
                        onClick={() => {
                          setOpen(false)
                        }}
                      >
                        {inner}
                      </Link>
                    </li>
                  )
                }
                return (
                  <li key={row.id} className="px-3 py-2 text-fg-secondary">
                    {inner}
                  </li>
                )
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
