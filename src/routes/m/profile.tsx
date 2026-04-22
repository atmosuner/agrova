/* eslint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/macro'
import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { changeAccountPassword } from '@/features/auth/change-account-password'
import { changePasswordFormValuesSchema } from '@/features/auth/validation'
import { signOutAndClearLocalData } from '@/features/auth/logout'
import { useMyPersonQuery } from '@/features/people/useMyPersonQuery'
import { formFieldClassName } from '@/lib/form-field-class'

export const Route = createFileRoute('/m/profile')({
  component: ProfilePage,
})

function ProfilePage() {
  const { data: me, isLoading } = useMyPersonQuery()
  const [pwCurrent, setPwCurrent] = useState('')
  const [pwNew, setPwNew] = useState('')
  const [pwNew2, setPwNew2] = useState('')
  const [pwErr, setPwErr] = useState<string | null>(null)
  const [pwOk, setPwOk] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)
  const navigate = useNavigate()

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
    await signOutAndClearLocalData()
    void navigate({ to: '/login', search: { redirect: undefined } })
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
      <div className="mt-4 rounded-xl border border-border bg-surface-0 p-4">
        <p className="text-sm text-fg-faint">{t`Ad`}</p>
        <p className="text-lg text-fg">{me.full_name}</p>
        <p className="mt-2 text-sm text-fg-faint">{t`Telefon`}</p>
        <p className="text-fg">{me.phone}</p>
        <p className="mt-2 text-sm text-fg-faint">{t`Rol`}</p>
        <p className="text-fg">{me.role}</p>
      </div>

      <p className="mt-4 text-sm text-fg-faint">
        {t`Bildirimleri sessize alma bu uygulamada yasaktır.`}
      </p>

      <form onSubmit={onChangePassword} className="mt-6 rounded-xl border border-border bg-surface-0 p-4">
        <p className="text-sm font-medium text-fg">{t`Change password`}</p>
        <p className="mt-1 text-xs text-fg-secondary">
          {t`Cihaz e-postanız ve mevcut şifreniz. E-posta ile sıfırlama cihaz hesaplarında yok.`}
        </p>
        <div className="mt-3 flex flex-col gap-1">
          <label className="text-xs text-fg-secondary" htmlFor="mp0">
            {t`Current password`}
          </label>
          <input
            id="mp0"
            type="password"
            autoComplete="current-password"
            className={formFieldClassName}
            value={pwCurrent}
            onChange={(e) => setPwCurrent(e.target.value)}
          />
        </div>
        <div className="mt-2 flex flex-col gap-1">
          <label className="text-xs text-fg-secondary" htmlFor="mp1">
            {t`New password`}
          </label>
          <input
            id="mp1"
            type="password"
            autoComplete="new-password"
            className={formFieldClassName}
            value={pwNew}
            onChange={(e) => setPwNew(e.target.value)}
          />
        </div>
        <div className="mt-2 flex flex-col gap-1">
          <label className="text-xs text-fg-secondary" htmlFor="mp2">
            {t`Confirm new password`}
          </label>
          <input
            id="mp2"
            type="password"
            autoComplete="new-password"
            className={formFieldClassName}
            value={pwNew2}
            onChange={(e) => setPwNew2(e.target.value)}
          />
        </div>
        {pwErr ? <p className="mt-2 text-sm text-harvest-500">{pwErr}</p> : null}
        {pwOk ? <p className="mt-2 text-sm text-orchard-700">{t`Password updated.`}</p> : null}
        <Button type="submit" className="mt-3 w-full" disabled={pwSaving}>
          {pwSaving ? t`Saving…` : t`Update password`}
        </Button>
      </form>

      <div className="mt-6">
        <Button
          type="button"
          variant="destructive"
          className="w-full"
          onClick={onLogout}
        >
          {t`Çıkış yap`}
        </Button>
        <p className="mt-2 text-center text-sm text-fg-faint">
          {t`Şifrenizi unuttuysanız işletme sahibinden (Ekip) yeni şifre isteyin.`}
        </p>
      </div>
    </div>
  )
}

