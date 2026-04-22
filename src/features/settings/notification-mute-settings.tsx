import { msg, t } from '@lingui/macro'
import { useCallback, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { MUTEABLE_OWNER_PUSH_ACTIONS, readMutedEventActions } from '@/lib/notification-prefs'
import { mergeNotificationPrefs } from '@/lib/theme'
import { useMyPersonQuery } from '@/features/people/useMyPersonQuery'
import { i18n } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import type { Json } from '@/types/db'

function actionLabel(action: string): string {
  const m: Record<string, () => string> = {
    'task.created': () => i18n._(msg`Görev oluşturuldu`),
    'task.reassigned': () => i18n._(msg`Görev aktarıldı`),
    'task.started': () => i18n._(msg`Görev başlatıldı`),
    'task.done': () => i18n._(msg`Görev bitti`),
    'task.blocked': () => i18n._(msg`Görev bloke edildi`),
    'task.duplicated': () => i18n._(msg`Görev kopyalandı`),
    'issue.resolved': () => i18n._(msg`Sorun kapatıldı`),
  }
  return m[action]?.() ?? action
}

export function NotificationMuteSettings() {
  const { data: me, refetch } = useMyPersonQuery()
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const muted = useMemo(
    () => new Set(readMutedEventActions(me?.notification_prefs as Json | undefined)),
    [me?.notification_prefs],
  )

  const toggle = useCallback(
    async (action: string, next: boolean) => {
      if (!me) {
        return
      }
      setErr(null)
      setSaving(true)
      const current = new Set(readMutedEventActions(me.notification_prefs as Json | undefined))
      if (next) {
        current.add(action)
      } else {
        current.delete(action)
      }
      const nextPrefs = mergeNotificationPrefs(me.notification_prefs, {
        muted_event_actions: [...current] as unknown as Json,
      }) as Json
      /* eslint-disable-next-line lingui/no-unlocalized-strings -- PostgREST */
      const { error } = await supabase.from('people').update({ notification_prefs: nextPrefs }).eq('id', me.id)
      setSaving(false)
      if (error) {
        setErr(error.message)
        return
      }
      await refetch()
    },
    [me, refetch],
  )

  if (!me || me.role !== 'OWNER') {
    return null
  }

  return (
    <section className="mt-10 max-w-md border-t border-border pt-8" aria-label={i18n._(msg`Bildirim sessize alma`)}>
      <h2 className="text-lg font-medium text-fg">{t`Bildirimler (Web Push)`}</h2>
      <p className="mt-1 text-sm text-fg-secondary">
        {t`Aşağıdaki olaylar için itici bildirim gönderilmez. Yeni saha sorunu raporları (KPI) sessize alınamaz — tarayıcı / cihaz izinlerine de bağlıdır.`}
      </p>
      <ul className="mt-4 space-y-3">
        {MUTEABLE_OWNER_PUSH_ACTIONS.map((action) => (
          <li key={action} className="flex items-start gap-3">
            <input
              id={`mute-${action}`}
              type="checkbox"
              className="mt-0.5 h-4 w-4"
              checked={muted.has(action)}
              disabled={saving}
              onChange={(e) => {
                void toggle(action, e.target.checked)
              }}
            />
            <label htmlFor={`mute-${action}`} className="text-sm text-fg">
              {actionLabel(action)}
            </label>
          </li>
        ))}
        <li className="flex items-start gap-3 opacity-60">
          <input id="mute-issue-reported" type="checkbox" className="mt-0.5 h-4 w-4" checked disabled />
          <label htmlFor="mute-issue-reported" className="text-sm text-fg">
            {i18n._(msg`Yeni saha sorunu (KPI)`)}
            <span className="ml-1 text-xs text-fg-muted">({t`Zorunlu açık`})</span>
          </label>
        </li>
      </ul>
      {err ? <p className="mt-2 text-sm text-harvest-600">{err}</p> : null}
      <p className="mt-6 text-sm text-fg-secondary">
        <Link to="/privacy" className="font-medium text-orchard-600 hover:underline">
          {t`Gizlilik (KVKK) sayfası`}
        </Link>
      </p>
    </section>
  )
}
