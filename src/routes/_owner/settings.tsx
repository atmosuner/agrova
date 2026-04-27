import { msg, t } from '@lingui/macro'
import { useMemo, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { signOutAndClearLocalData } from '@/features/auth/logout'
import { LOCKED_APP_TIMEZONE } from '@/features/settings/constants'
import { useOperationSettings } from '@/features/settings/use-operation-settings'
import { downloadAgrovaDataExport } from '@/features/settings/download-export'
import { NotificationMuteSettings } from '@/features/settings/notification-mute-settings'
import { changeAccountPassword } from '@/features/auth/change-account-password'
import { changePasswordFormValuesSchema } from '@/features/auth/validation'
import { operationSettingsFormSchema, type OperationSettingsFormValues } from '@/features/settings/validation'
import { formFieldClassName } from '@/lib/form-field-class'
import { i18n } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'

export const Route = createFileRoute('/_owner/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const navigate = useNavigate()
  const { settings, refresh, loading: bootLoading } = useOperationSettings()
  const [exporting, setExporting] = useState(false)
  const [exportErr, setExportErr] = useState<string | null>(null)
  const fromDb = useMemo((): OperationSettingsFormValues => {
    if (settings) {
      return { operationName: settings.operation_name, weatherCity: settings.weather_city }
    }
    return { operationName: '', weatherCity: '' }
  }, [settings])
  const [draft, setDraft] = useState<OperationSettingsFormValues | null>(null)
  const values = draft ?? fromDb
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState<string | null>(null)
  const [pwCurrent, setPwCurrent] = useState('')
  const [pwNew, setPwNew] = useState('')
  const [pwNew2, setPwNew2] = useState('')
  const [pwErr, setPwErr] = useState<string | null>(null)
  const [pwOk, setPwOk] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)

  function setField(name: keyof OperationSettingsFormValues, value: string) {
    setDraft((d) => ({ ...(d ?? fromDb), [name]: value }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    setOk(false)
    const parsed = operationSettingsFormSchema.safeParse(values)
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? t`Formu kontrol edin.`)
      return
    }
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.user) {
      setFormError(t`Oturum bulunamadı.`)
      return
    }
    setSaving(true)
    /* eslint-disable lingui/no-unlocalized-strings -- PostgREST */
    const { error: err } = await supabase.from('operation_settings').upsert(
      {
        user_id: session.user.id,
        operation_name: parsed.data.operationName,
        weather_city: parsed.data.weatherCity,
        timezone: LOCKED_APP_TIMEZONE,
      },
      { onConflict: 'user_id' },
    )
    /* eslint-enable lingui/no-unlocalized-strings */
    setSaving(false)
    if (err) {
      setFormError(err.message)
      return
    }
    setOk(true)
    setDraft(null)
    await refresh()
  }

  async function onChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwErr(null)
    setPwOk(false)
    const parsed = changePasswordFormValuesSchema.safeParse({
      currentPassword: pwCurrent,
      newPassword: pwNew,
      newPasswordConfirm: pwNew2,
    })
    if (!parsed.success) {
      setPwErr(parsed.error.issues[0]?.message ?? t`Formu kontrol edin.`)
      return
    }
    setPwSaving(true)
    const r = await changeAccountPassword(parsed.data.currentPassword, parsed.data.newPassword)
    setPwSaving(false)
    if (!r.ok) {
      setPwErr(r.message)
      return
    }
    setPwOk(true)
    setPwCurrent('')
    setPwNew('')
    setPwNew2('')
  }

  async function onLogout() {
    setLogoutError(null)
    setLoggingOut(true)
    try {
      await signOutAndClearLocalData()
      void navigate({ to: '/login', search: { redirect: undefined } })
    } catch (e) {
      setLogoutError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoggingOut(false)
    }
  }

  if (bootLoading && !settings) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-surface-0 p-5">
          <p className="text-sm text-fg-secondary">{t`Yükleniyor…`}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Operation settings */}
      <section className="rounded-xl border border-border bg-surface-0 p-5" aria-label={i18n._(msg`İşletme ayarları`)}>
        <h2 className="text-sm font-semibold text-fg">{t`İşletme ayarları`}</h2>
        <p className="mt-0.5 text-[12px] text-fg-secondary">
          {t`İşletme adı, hava durumu şehri ve sabit saat dilimi.`}
        </p>
        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-medium text-fg" htmlFor="st-op">
              {t`İşletme adı`}
            </label>
            <input
              id="st-op"
              name="operationName"
              type="text"
              autoComplete="organization"
              className={formFieldClassName}
              value={values.operationName}
              onChange={(e) => setField('operationName', e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-medium text-fg" htmlFor="st-city">
              {t`Hava durumu şehri`}
            </label>
            <input
              id="st-city"
              name="weatherCity"
              type="text"
              className={formFieldClassName}
              placeholder="Antalya"
              value={values.weatherCity}
              onChange={(e) => setField('weatherCity', e.target.value)}
              required
            />
            <p className="text-[11px] text-fg-muted">
              {t`Hava durumu widgetı için Türkçe şehir adı.`}
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[12px] font-medium text-fg">{t`Saat dilimi`}</span>
            <p className="rounded-lg border border-border bg-surface-1 px-3 py-2 text-[13px] text-fg-secondary">
              {LOCKED_APP_TIMEZONE}
              <span className="ml-2 text-[11px] text-fg-muted">({t`sabit`})</span>
            </p>
          </div>
          {formError ? <p className="text-[12px] text-harvest-500">{formError}</p> : null}
          {ok ? <p className="text-[12px] text-orchard-700">{t`Kaydedildi.`}</p> : null}
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? t`Kaydediliyor…` : t`Kaydet`}
          </Button>
        </form>
      </section>

      {/* Password */}
      <section className="rounded-xl border border-border bg-surface-0 p-5" aria-label={i18n._(msg`Şifre`)}>
        <h2 className="text-sm font-semibold text-fg">{t`Şifre değiştir`}</h2>
        <p className="mt-0.5 text-[12px] text-fg-secondary">
          {t`Mevcut şifrenizi, ardından yeni bir şifre girin (8–72 karakter).`}
        </p>
        <form onSubmit={onChangePassword} className="mt-4 space-y-3">
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-medium text-fg" htmlFor="st-pw0">
              {t`Mevcut şifre`}
            </label>
            <input
              id="st-pw0"
              type="password"
              autoComplete="current-password"
              className={formFieldClassName}
              value={pwCurrent}
              onChange={(e) => setPwCurrent(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-medium text-fg" htmlFor="st-pw1">
              {t`Yeni şifre`}
            </label>
            <input
              id="st-pw1"
              type="password"
              autoComplete="new-password"
              className={formFieldClassName}
              value={pwNew}
              onChange={(e) => setPwNew(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-medium text-fg" htmlFor="st-pw2">
              {t`Yeni şifre (tekrar)`}
            </label>
            <input
              id="st-pw2"
              type="password"
              autoComplete="new-password"
              className={formFieldClassName}
              value={pwNew2}
              onChange={(e) => setPwNew2(e.target.value)}
            />
          </div>
          {pwErr ? <p className="text-[12px] text-harvest-500">{pwErr}</p> : null}
          {pwOk ? <p className="text-[12px] text-orchard-700">{t`Şifre güncellendi.`}</p> : null}
          <Button type="submit" size="sm" disabled={pwSaving}>
            {pwSaving ? t`Kaydediliyor…` : t`Şifreyi güncelle`}
          </Button>
        </form>
      </section>

      {/* Notifications */}
      <NotificationMuteSettings />

      {/* Data export */}
      <section className="rounded-xl border border-border bg-surface-0 p-5" aria-label={i18n._(msg`Veri dışa aktarma`)}>
        <h2 className="text-sm font-semibold text-fg">{t`Tüm verilerimi indir`}</h2>
        <p className="mt-0.5 text-[12px] text-fg-secondary">
          {t`JSON dışa aktarma (KVKK). Sahibi olan tabloların bir anlık görüntüsü.`}
        </p>
        {exportErr ? <p className="mt-2 text-[12px] text-harvest-600">{exportErr}</p> : null}
        <Button
          type="button"
          // eslint-disable-next-line lingui/no-unlocalized-strings -- CVA token
          variant="secondary"
          size="sm"
          className="mt-3"
          disabled={exporting}
          onClick={() => {
            setExportErr(null)
            setExporting(true)
            void downloadAgrovaDataExport()
              .catch((e: unknown) => {
                setExportErr(e instanceof Error ? e.message : String(e))
              })
              .finally(() => {
                setExporting(false)
              })
          }}
        >
          {exporting ? t`Hazırlanıyor…` : t`İndir`}
        </Button>
      </section>

      {/* Logout */}
      <section
        className="rounded-xl border border-status-blocked/20 bg-status-blocked/5 p-5"
        aria-label={i18n._(msg`Oturum`)}
      >
        <h2 className="text-sm font-semibold text-fg">{t`Çıkış yap`}</h2>
        <p className="mt-0.5 text-[12px] text-fg-secondary">
          {t`Bu cihazdaki oturumu sonlandırın. İş e-postanız ve şifrenizle tekrar giriş yapabilirsiniz.`}
        </p>
        {logoutError ? <p className="mt-2 text-[12px] text-harvest-600">{logoutError}</p> : null}
        <Button
          type="button"
          // eslint-disable-next-line lingui/no-unlocalized-strings -- CVA token
          variant="destructive"
          size="sm"
          className="mt-3"
          disabled={loggingOut}
          onClick={() => {
            void onLogout()
          }}
        >
          {loggingOut ? t`Çıkış yapılıyor…` : t`Çıkış yap`}
        </Button>
      </section>
    </div>
  )
}
