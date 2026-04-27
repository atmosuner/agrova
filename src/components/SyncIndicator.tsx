/* eslint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/macro'
import { useLiveQuery } from 'dexie-react-hooks'
import { useState, useSyncExternalStore } from 'react'
import { db } from '@/lib/db'
import { cn } from '@/lib/utils'
import { SyncSheet } from '@/components/SyncSheet'

function subscribeOnLine(callback: () => void): () => void {
  globalThis.addEventListener('online', callback)
  globalThis.addEventListener('offline', callback)
  return () => {
    globalThis.removeEventListener('online', callback)
    globalThis.removeEventListener('offline', callback)
  }
}

function getOnLine(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true
}

function getServerOnLine(): boolean {
  return true
}

export function SyncIndicator() {
  const [sheet, setSheet] = useState(false)
  const pending = useLiveQuery(() => db.outbox.count(), [], 0) ?? 0
  const onLine = useSyncExternalStore(subscribeOnLine, getOnLine, getServerOnLine)

  const offline = !onLine
  const pendingState = onLine && pending > 0

  const dotClass = offline
    ? 'bg-surface-2 border border-border-strong'
    : pendingState
      ? 'bg-harvest-500'
      : 'bg-orchard-500'

  const p = String(pending)
  const a11yStatus = offline ? t`Çevrimdışı` : pendingState ? t`Bekleyen: ${p}` : t`Eşitlendi`

  return (
    <>
      <button
        type="button"
        className={cn(
          'relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-surface-0 transition',
          offline ? 'border-border-strong' : 'border-border',
        )}
        aria-label={a11yStatus}
        title={a11yStatus}
        onClick={() => setSheet(true)}
      >
        {pendingState ? (
          <span
            aria-hidden
            className="absolute inset-0 m-auto h-5 w-5 animate-ping rounded-full bg-harvest-500/25"
          />
        ) : null}
        <span className={cn('relative h-2.5 w-2.5 rounded-full', dotClass)} />
        {pending > 0 ? (
          <span
            className="absolute -right-1 -top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-harvest-500 px-1 text-[10px] font-semibold text-white"
            aria-hidden
          >
            {pending > 9 ? '9+' : pending}
          </span>
        ) : null}
      </button>
      {sheet ? <SyncSheet onClose={() => setSheet(false)} /> : null}
    </>
  )
}
