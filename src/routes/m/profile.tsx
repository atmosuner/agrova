/* eslint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/macro'
import { useEffect, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { signOutAndClearLocalData } from '@/features/auth/logout'
import { useMyPersonQuery } from '@/features/people/useMyPersonQuery'
import {
  applyThemeToDocument,
  getStoredAgrovaTheme,
  mergeNotificationPrefs,
  type AgrovaTheme,
  readThemeFromProfilePrefs,
  setStoredAgrovaTheme,
  readMutePush,
} from '@/lib/theme'
import { supabase } from '@/lib/supabase'
import type { Json } from '@/types/db'

export const Route = createFileRoute('/m/profile')({
  component: ProfilePage,
})

function ProfilePage() {
  const { data: me, isLoading, refetch } = useMyPersonQuery()
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const navigate = useNavigate()

  const pushMuted = me ? readMutePush(me.notification_prefs as Json) : false
  const activeTheme: AgrovaTheme = me
    ? (readThemeFromProfilePrefs(me.notification_prefs as Json) ?? getStoredAgrovaTheme())
    : getStoredAgrovaTheme()

  useEffect(() => {
    if (!me) {
      return
    }
    const fromProfile = readThemeFromProfilePrefs(me.notification_prefs as Json)
    if (fromProfile) {
      setStoredAgrovaTheme(fromProfile)
      applyThemeToDocument(fromProfile)
    }
  }, [me])

  async function persistPrefs(patch: { push_muted?: boolean; theme?: AgrovaTheme }) {
    if (!me) {
      return
    }
    setErr(null)
    setSaving(true)
    try {
      const next = mergeNotificationPrefs(me.notification_prefs, patch as unknown as Record<string, Json | undefined>) as
        | Json
        | undefined
      const { error } = await supabase.from('people').update({ notification_prefs: next }).eq('id', me.id)
      if (error) {
        throw error
      }
      if (patch.theme) {
        setStoredAgrovaTheme(patch.theme)
        applyThemeToDocument(patch.theme)
      }
      await refetch()
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  async function onLogout() {
    setErr(null)
    await signOutAndClearLocalData()
    void navigate({ to: '/login', search: { redirect: undefined, worker: true } })
  }

  if (isLoading) {
    return (
      <div className="px-4 pt-6">
        <p className="text-sm text-fg-secondary">{t`Yükleniyor…`}</p>
      </div>
    )
  }

  if (!me) {
    return (
      <div className="px-4 pt-6">
        <p className="text-fg-secondary">{t`Profil yüklenemedi.`}</p>
      </div>
    )
  }

  return (
    <div className="px-4 pb-8 pt-4">
      <h1 className="text-xl font-semibold text-fg">{t`Profil`}</h1>
      {err ? <p className="mt-2 text-sm text-harvest-500">{err}</p> : null}
      <div className="mt-4 rounded-xl border border-border bg-surface-0 p-4">
        <p className="text-sm text-fg-faint">{t`Ad`}</p>
        <p className="text-lg text-fg">{me.full_name}</p>
        <p className="mt-2 text-sm text-fg-faint">{t`Telefon`}</p>
        <p className="text-fg">{me.phone}</p>
        <p className="mt-2 text-sm text-fg-faint">{t`Rol`}</p>
        <p className="text-fg">{me.role}</p>
      </div>

      <div className="mt-4">
        <p className="text-sm font-medium text-fg">{t`Bildirimler`}</p>
        <label className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-border bg-surface-0 px-3 py-2">
          <span className="text-sm text-fg-secondary">{t`Bildirimleri sessize al`}</span>
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={pushMuted}
            onChange={async (e) => {
              await persistPrefs({ push_muted: e.target.checked, theme: activeTheme })
            }}
            disabled={saving}
          />
        </label>
      </div>

      <div className="mt-4">
        <p className="text-sm font-medium text-fg">{t`Görünüm`}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {(
            [
              { k: 'system' as const, label: t`Sistem` },
              { k: 'light' as const, label: t`Açık` },
              { k: 'dark' as const, label: t`Koyu` },
            ] as const
          ).map((o) => (
            <Button
              key={o.k}
              type="button"
              variant={activeTheme === o.k ? 'default' : 'outline'}
              size="sm"
              disabled={saving}
              onClick={async () => {
                await persistPrefs({ push_muted: readMutePush(me.notification_prefs as Json), theme: o.k })
              }}
            >
              {o.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <Button
          type="button"
          variant="destructive"
          className="w-full"
          onClick={onLogout}
        >
          {t`Çıkış yap`}
        </Button>
        <p className="mt-2 text-center text-sm text-fg-faint">
          {t`Yeni kurulum linki için işletme sahibiyle iletişime geçin.`}
        </p>
      </div>
    </div>
  )
}
