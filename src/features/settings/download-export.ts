/* eslint-disable lingui/no-unlocalized-strings -- technical errors and filenames */
import { supabase } from '@/lib/supabase'

/** M8-07: owner-only JSON export via `export-data` Edge Function. */
export async function downloadAgrovaDataExport(): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.access_token) {
    throw new Error('no session')
  }
  const base = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '') ?? ''
  const r = await fetch(`${base}/functions/v1/export-data`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${session.access_token}`, apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string },
  })
  if (!r.ok) {
    const t = await r.text()
    throw new Error(t || r.statusText)
  }
  const text = await r.text()
  const blob = new Blob([text], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `agrova-export-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(a.href)
}
