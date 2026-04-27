import { msg, t } from '@lingui/macro'
import { useState } from 'react'
import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import {
  AuthErrorMessage,
  AuthShell,
  authInputClassName,
  authInputErrorClassName,
  authPrimaryButtonClassName,
} from '@/components/layout/AuthShell'
import { safePostAuthPath } from '@/features/auth/redirect'
import { resolveAppShellForUser } from '@/features/auth/resolve-app-shell'
import { loginFormSchema, type LoginFormValues } from '@/features/auth/validation'
import { i18n } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

/* eslint-disable lingui/no-unlocalized-strings -- map raw provider messages to Turkish for display */
function mapAuthErrorToTr(message: string): string {
  const lower = message.toLowerCase()
  if (
    lower.includes('invalid login') ||
    lower.includes('invalid email or password') ||
    lower.includes('invalid login credentials')
  ) {
    return 'E-posta veya şifre hatalı.'
  }
  return message
}
/* eslint-enable lingui/no-unlocalized-strings */

export const Route = createFileRoute('/login')({
  beforeLoad: async ({ search }) => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (session) {
      const shell = await resolveAppShellForUser(session.user)
      if (shell === 'worker') {
        throw redirect({ to: safePostAuthPath(search.redirect, { mode: 'worker' }) })
      }
      throw redirect({ to: safePostAuthPath(search.redirect) })
    }
  },
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === 'string' ? s.redirect : undefined,
  }),
  component: LoginPage,
})

function LoginPage() {
  const { redirect: redirectTo } = Route.useSearch()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [values, setValues] = useState<LoginFormValues>({ email: '', password: '' })

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    const parsed = loginFormSchema.safeParse(values)
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? t`Formu kontrol edin.`)
      return
    }
    setSubmitting(true)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    })
    setSubmitting(false)
    if (error) {
      setFormError(mapAuthErrorToTr(error.message))
      return
    }
    if (!data.session) {
      setFormError(t`Oturum açılamadı. Yeniden deneyin.`)
      return
    }
    const shell = await resolveAppShellForUser(data.session.user)
    const target = safePostAuthPath(redirectTo, { mode: shell })
    void navigate({ to: target, replace: true })
  }

  return (
    <AuthShell
      title={i18n._(msg`Giriş`)}
      subtitle={i18n._(msg`İş e-postası ve şifre.`)}
      footer={
        <>
          <p className="text-center text-[13px] text-fg-secondary">
            {i18n._(msg`Hesabınız yok mu?`)}{' '}
            <Link
              to="/signup"
              search={{ redirect: redirectTo }}
              className="font-medium text-orchard-500 underline-offset-2 hover:underline"
            >
              {i18n._(msg`Kayıt olun`)}
            </Link>
          </p>
          <Link to="/privacy" className="text-xs text-fg-faint underline-offset-2 hover:underline">
            {i18n._(msg`Gizlilik`)}
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-fg" htmlFor="lo-email">
            {i18n._(msg`E-posta`)}
          </label>
          <input
            id="lo-email"
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
          <div className="flex items-baseline justify-between gap-3">
            <label className="text-[13px] font-medium text-fg" htmlFor="lo-pass">
              {i18n._(msg`Şifre`)}
            </label>
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-orchard-500 underline-offset-2 hover:underline"
            >
              {i18n._(msg`Şifremi unuttum`)}
            </Link>
          </div>
          <input
            id="lo-pass"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            className={cn(formError ? authInputErrorClassName : authInputClassName)}
            value={values.password}
            onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
            required
            aria-invalid={formError ? true : undefined}
            aria-describedby={formError ? 'lo-error' : undefined}
          />
        </div>
        {formError ? (
          <div id="lo-error">
            <AuthErrorMessage>{formError}</AuthErrorMessage>
          </div>
        ) : null}
        <button type="submit" className={cn(authPrimaryButtonClassName, 'mt-1')} disabled={submitting}>
          {submitting ? t`Giriş yapılıyor…` : t`Giriş yap`}
        </button>
      </form>
    </AuthShell>
  )
}
