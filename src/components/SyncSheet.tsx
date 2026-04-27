/* eslint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/macro'
import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { db, type OutboxRow } from '@/lib/db'
import { cn } from '@/lib/utils'

type Props = {
  onClose: () => void
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })
}

function kindLabel(kind: OutboxRow['kind']): string {
  switch (kind) {
    case 'task_status':
      return 'Görev'
    case 'task_completion':
      return 'Görev bitiş'
    case 'task_reassign':
      return 'Aktar'
    case 'task_equipment':
      return 'Alet'
    case 'issue_row':
    case 'issue_photo':
    case 'issue_voice':
      return 'Sorun'
    default:
      return kind
  }
}

export function SyncSheet({ onClose }: Props) {
  const rows = useLiveQuery(
    () =>
      db.outbox
        .orderBy('enqueued_at')
        .reverse()
        .limit(20)
        .toArray(),
    [],
  )

  const list = useMemo(() => (rows ? [...rows] : []), [rows])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 pb-[env(safe-area-inset-bottom,0px)] pt-[env(safe-area-inset-top,0px)] sm:items-center sm:p-4"
      role="dialog"
      aria-modal
      onClick={onClose}
    >
      <div
        className={cn(
          'max-h-[70vh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-border-strong bg-surface-0 p-4 ring-[3px] ring-[rgba(12,18,16,0.04)] sm:rounded-2xl',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-lg font-medium text-fg">{t`Bekleyen`}</h2>
          <Button type="button" variant="ghost" size="icon" aria-label={t`Kapat`} onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        {list.length === 0 ? (
          <p className="text-sm text-fg-secondary">{t`Kuyrukta kayıt yok.`}</p>
        ) : (
          <ul className="flex flex-col gap-2 text-sm text-fg-secondary">
            {list.map((r) => (
              <li key={r.id} className="rounded-lg border border-border bg-surface-1 px-3 py-2">
                <p className="font-medium text-fg">
                  {kindLabel(r.kind)} — {r.id.slice(0, 8)}…
                </p>
                <p className="text-xs text-fg-faint">
                  {formatTime(r.enqueued_at)}
                  {r.last_error ? ` — ${r.last_error}` : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
