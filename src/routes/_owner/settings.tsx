import { t } from '@lingui/macro'
import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { LOCKED_APP_TIMEZONE } from '@/features/settings/constants'
import { useOperationSettings } from '@/features/settings/use-operation-settings'
import { operationSettingsFormSchema, type OperationSettingsFormValues } from '@/features/settings/validation'
import { formFieldClassName } from '@/lib/form-field-class'
import { supabase } from '@/lib/supabase'

export const Route = createFileRoute('/_owner/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const { settings, refresh, loading: bootLoading } = useOperationSettings()
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

  if (bootLoading && !settings) {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-fg">{t`Settings`}</h1>
        <p className="mt-2 text-fg-secondary">{t`Loading…`}</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-fg">{t`Settings`}</h1>
      <p className="mt-2 max-w-md text-fg-secondary">
        {t`Operation name, weather city, and a fixed time zone. Use Turkish city names (e.g. Antalya).`}
      </p>
      <form onSubmit={onSubmit} className="mt-6 max-w-md space-y-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-fg" htmlFor="st-op">
            {t`Operation name`}
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
          <label className="text-sm font-medium text-fg" htmlFor="st-city">
            {t`Weather city`}
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
          <p className="text-xs text-fg-muted">
            {t`Turkish name as you would say it; used for the forecast widget (later).`}
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-fg">{t`Time zone`}</span>
          <p className="rounded-md border border-border bg-surface-1 px-3 py-2 text-fg-secondary">
            {LOCKED_APP_TIMEZONE}
            <span className="ml-2 text-xs text-fg-muted">({t`locked`})</span>
          </p>
        </div>
        {formError ? <p className="text-sm text-harvest-500">{formError}</p> : null}
        {ok ? <p className="text-sm text-orchard-700">{t`Saved.`}</p> : null}
        <Button type="submit" disabled={saving}>
          {saving ? t`Saving…` : t`Save`}
        </Button>
      </form>
    </div>
  )
}
