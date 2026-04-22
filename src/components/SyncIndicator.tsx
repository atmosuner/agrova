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

  const color =
    !onLine ? 'bg-surface-2' : pending > 0 ? 'bg-harvest-500' : 'bg-orchard-500'

  const p = String(pending)
  const a11yStatus = !onLine
    ? t`Çevrimdışı`
    : pending > 0
      ? t`Bekleyen: ${p}`
      : t`Eşitlendi`

  return (
    <>
      <button
        type="button"
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface-0"
        aria-label={a11yStatus}
        onClick={() => setSheet(true)}
      >
        <span className={cn('h-2.5 w-2.5 rounded-full', color)} />
      </button>
      {sheet ? <SyncSheet onClose={() => setSheet(false)} /> : null}
    </>
  )
}
