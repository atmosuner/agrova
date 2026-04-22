/* eslint-disable react-refresh/only-export-components -- context + provider module */
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/db'

type Row = Tables<'operation_settings'>

export type OperationSettingsContextValue = {
  settings: Row | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export const OperationSettingsContext = createContext<OperationSettingsContextValue | null>(null)

export function OperationSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Row | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.user) {
      setSettings(null)
      setError(null)
      setLoading(false)
      return
    }
    setLoading(true)
    /* eslint-disable lingui/no-unlocalized-strings -- PostgREST table/column args */
    const { data, error: qe } = await supabase
      .from('operation_settings')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle()
    /* eslint-enable lingui/no-unlocalized-strings */
    setLoading(false)
    if (qe) {
      setError(qe.message)
      setSettings(null)
      return
    }
    setError(null)
    setSettings(data)
  }, [])

  useEffect(() => {
    const t = window.setTimeout(() => {
      void refresh()
    }, 0)
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      void refresh()
    })
    return () => {
      window.clearTimeout(t)
      sub.subscription.unsubscribe()
    }
  }, [refresh])

  const value = useMemo(
    () => ({ settings, loading, error, refresh }),
    [settings, loading, error, refresh],
  )

  return (
    <OperationSettingsContext.Provider value={value}>{children}</OperationSettingsContext.Provider>
  )
}
