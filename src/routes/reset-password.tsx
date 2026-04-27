import { msg, t } from '@lingui/macro'
import { useEffect, useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  AuthErrorMessage,
  AuthShell,
  authInputClassName,
  authPrimaryButtonClassName,
} from '@/components/layout/AuthShell'
import { PasswordStrengthBar } from '@/components/ui/PasswordStrengthBar'
import { newPasswordPairValuesSchema } from '@/features/auth/validation'
import { i18n } from '@/lib/i18n'
import { getSiteUrl } from '@/lib/site-url'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/reset-password')({
  component: ResetPasswordPage,
})

function ResetPasswordPage() {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [gaveUp, setGaveUp] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })
    let n = 0
    const id = window.setInterval(() => {
      void supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setReady(true)
          window.clearInterval(id)
        }
      })
      n += 1
      if (n >= 25) {
        window.clearInterval(id)
        setGaveUp(true)
      }
    }, 200)
    return () => {
      window.clearInterval(id)
      subscription.unsubscribe()
    }
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    const parsed = newPasswordPairValuesSchema.safeParse({ newPassword, newPasswordConfirm })
    if (!parsed.success) {
      setErr(parsed.error.issues[0]?.message ?? t`Formu kontrol edin.`)
      return
    }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: parsed.data.newPassword })
    setSaving(false)
    if (error) {
      setErr(error.message)
      return
    }
    await supabase.auth.signOut()
    void navigate({ to: '/login', search: { redirect: undefined }, replace: true })
  }

  if (!getSiteUrl()) {
    return (
      <AuthShell title={i18n._(msg`Yapılandırma hatası`)} subtitle={undefined} showDesktopPanel={false}>
        <p className="text-[14px] text-status-blocked">{t`VITE_SITE_URL tanımlı değil.`}</p>
      </AuthShell>
    )
  }

  if (!ready && !gaveUp) {
    return (
      <AuthShell
        title={i18n._(msg`Sıfırlama bağlantınız kontrol ediliyor…`)}
        subtitle={i18n._(msg`Birkaç saniye sürebilir.`)}
        showDesktopPanel={false}
      >
        <p className="text-[14px] text-fg-secondary">{t`Lütfen bekleyin.`}</p>
      </AuthShell>
    )
  }

  if (!ready && gaveUp) {
    return (
      <AuthShell
        title={i18n._(msg`Bağlantı geçersiz`)}
        subtitle={i18n._(msg`Bu bağlantı süresi dolmuş veya geçersiz. Yeni bir sıfırlama e-postası isteyin.`)}
        showDesktopPanel={false}
        footer={
          <Link
            to="/login"
            search={{ redirect: undefined }}
            className="text-[13px] font-medium text-orchard-500 underline-offset-2 hover:underline"
          >
            ← {i18n._(msg`Girişe dön`)}
          </Link>
        }
      >
        <Link
          to="/forgot-password"
          className={cn(authPrimaryButtonClassName, 'no-underline')}
        >
          {t`Yeni bağlantı iste`}
        </Link>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title={i18n._(msg`Yeni şifre belirle`)}
      subtitle={i18n._(msg`Güçlü bir şifre seçin.`)}
      footer={
        <Link
          to="/login"
          search={{ redirect: undefined }}
          className="text-[13px] font-medium text-orchard-500 underline-offset-2 hover:underline"
        >
          ← {i18n._(msg`Girişe dön`)}
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-fg" htmlFor="rp1">
            {i18n._(msg`Yeni şifre`)}
          </label>
          <input
            id="rp1"
            type="password"
            autoComplete="new-password"
            placeholder={i18n._(msg`En az 8 karakter`)}
            className={authInputClassName}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          {newPassword.length > 0 ? <PasswordStrengthBar value={newPassword} className="mt-1" /> : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-fg" htmlFor="rp2">
            {i18n._(msg`Şifre tekrar`)}
          </label>
          <input
            id="rp2"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            className={authInputClassName}
            value={newPasswordConfirm}
            onChange={(e) => setNewPasswordConfirm(e.target.value)}
            required
          />
        </div>
        {err ? <AuthErrorMessage>{err}</AuthErrorMessage> : null}
        <button type="submit" className={cn(authPrimaryButtonClassName, 'mt-1')} disabled={saving}>
          {saving ? t`Kaydediliyor…` : t`Şifremi Güncelle`}
        </button>
      </form>
    </AuthShell>
  )
}
