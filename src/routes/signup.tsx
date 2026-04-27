import { msg, t } from '@lingui/macro'
import { useState } from 'react'
import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import {
  AuthErrorMessage,
  AuthShell,
  authInputClassName,
  authPrimaryButtonClassName,
} from '@/components/layout/AuthShell'
import { PasswordStrengthBar } from '@/components/ui/PasswordStrengthBar'
import { safePostAuthPath } from '@/features/auth/redirect'
import { resolveAppShellForUser } from '@/features/auth/resolve-app-shell'
import { signUpFormSchema, type SignUpFormValues } from '@/features/auth/validation'
import { i18n } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

/* eslint-disable lingui/no-unlocalized-strings -- map raw provider/DB errors to Turkish for display */
function mapAuthErrorToTr(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('already registered') || lower.includes('user already')) {
    return 'Bu e-posta zaten kayıtlı.'
  }
  if (lower.includes('phone') && lower.includes('unique')) {
    return 'Bu telefon numarası zaten kayıtlı.'
  }
  if (lower.includes('metadata') && lower.includes('phone')) {
    return 'Telefon gerekli veya veritabanı hatası; destekle iletişime geçin.'
  }
  return message
}
/* eslint-enable lingui/no-unlocalized-strings */

const TR_PHONE_PREFIX = '+90'

export const Route = createFileRoute('/signup')({
  beforeLoad: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (session) {
      const shell = await resolveAppShellForUser(session.user)
      throw redirect({
        to: safePostAuthPath(undefined, { mode: shell === 'worker' ? 'worker' : 'owner' }),
      })
    }
  },
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === 'string' ? s.redirect : undefined,
  }),
  component: SignUpPage,
})

function SignUpPage() {
  const { redirect: redirectTo } = Route.useSearch()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [phoneLocal, setPhoneLocal] = useState('')
  const [values, setValues] = useState<Omit<SignUpFormValues, 'phone'>>({
    email: '',
    fullName: '',
    password: '',
    passwordConfirm: '',
  })

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    setInfo(null)
    const phone = `${TR_PHONE_PREFIX}${phoneLocal.replace(/\D/g, '')}`
    const parsed = signUpFormSchema.safeParse({ ...values, phone })
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? t`Formu kontrol edin.`)
      return
    }
    setSubmitting(true)
    const { email, password, fullName } = parsed.data
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone } },
    })
    setSubmitting(false)
    if (error) {
      setFormError(mapAuthErrorToTr(error.message))
      return
    }
    if (data.session) {
      const target = safePostAuthPath(redirectTo)
      void navigate({ to: target })
      return
    }
    setInfo(
      t`E-postanızı onaylayın, ardından giriş yapın. (Geliştirme modunda e-posta onayı kapalıysa giriş sayfasını kullanın.)`,
    )
  }

  return (
    <AuthShell
      title={i18n._(msg`Hesap oluştur`)}
      subtitle={i18n._(msg`Meyve bahçenizi Agrova'ya ekleyin.`)}
      footer={
        <>
          <Link
            to="/login"
            search={{ redirect: redirectTo }}
            className="text-[13px] font-medium text-orchard-500 underline-offset-2 hover:underline"
          >
            {i18n._(msg`Zaten hesabım var`)}
          </Link>
          <Link to="/privacy" className="text-xs text-fg-faint underline-offset-2 hover:underline">
            {i18n._(msg`Gizlilik politikası`)}
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-fg" htmlFor="su-name">
            {i18n._(msg`Ad Soyad`)}
          </label>
          <input
            id="su-name"
            name="fullName"
            type="text"
            autoComplete="name"
            placeholder="Kemal Yılmaz"
            className={authInputClassName}
            value={values.fullName}
            onChange={(e) => setValues((v) => ({ ...v, fullName: e.target.value }))}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-fg" htmlFor="su-email">
            {i18n._(msg`E-posta`)}
          </label>
          <input
            id="su-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="kemal@ciftlik.com.tr"
            className={authInputClassName}
            value={values.email}
            onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-fg" htmlFor="su-phone">
            {i18n._(msg`Telefon`)}
          </label>
          <div className="flex gap-2">
            <span
              aria-hidden
              className="inline-flex h-11 shrink-0 items-center gap-1 rounded-lg border border-border-strong bg-surface-1 px-2.5 text-[15px] text-fg-secondary"
            >
              <span aria-hidden>🇹🇷</span> {TR_PHONE_PREFIX}
            </span>
            <input
              id="su-phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="532 000 00 00"
              className={cn(authInputClassName, 'flex-1')}
              value={phoneLocal}
              onChange={(e) => setPhoneLocal(e.target.value)}
              required
            />
          </div>
          <p className="text-xs text-fg-muted">
            {i18n._(msg`SMS kodu gönderilmeyecek, sadece iletişim için.`)}
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-fg" htmlFor="su-pass">
            {i18n._(msg`Şifre`)}
          </label>
          <input
            id="su-pass"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder={i18n._(msg`En az 8 karakter`)}
            className={authInputClassName}
            value={values.password}
            onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
            required
          />
          {values.password.length > 0 ? <PasswordStrengthBar value={values.password} className="mt-1" /> : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-fg" htmlFor="su-pass2">
            {i18n._(msg`Şifre tekrar`)}
          </label>
          <input
            id="su-pass2"
            name="passwordConfirm"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            className={authInputClassName}
            value={values.passwordConfirm}
            onChange={(e) => setValues((v) => ({ ...v, passwordConfirm: e.target.value }))}
            required
          />
        </div>
        {formError ? <AuthErrorMessage>{formError}</AuthErrorMessage> : null}
        {info ? <p className="text-[13px] text-fg-secondary">{info}</p> : null}
        <button type="submit" className={cn(authPrimaryButtonClassName, 'mt-1')} disabled={submitting}>
          {submitting ? t`Kaydediliyor…` : t`Kayıt ol`}
        </button>
      </form>
    </AuthShell>
  )
}
