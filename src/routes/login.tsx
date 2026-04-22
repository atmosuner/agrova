import { t } from '@lingui/macro'
import { useState } from 'react'
import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { safePostAuthPath } from '@/features/auth/redirect'
import { loginFormSchema, type LoginFormValues } from '@/features/auth/validation'
import { formFieldClassName } from '@/lib/form-field-class'
import { isWorkerUser } from '@/lib/auth-worker'
import { supabase } from '@/lib/supabase'

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
      if (isWorkerUser(session.user)) {
        throw redirect({ to: safePostAuthPath(search.redirect, { mode: 'worker' }) })
      }
      throw redirect({ to: safePostAuthPath(search.redirect) })
    }
  },
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === 'string' ? s.redirect : undefined,
    worker: s.worker === '1' || s.worker === 1 || s.worker === true,
  }),
  component: LoginPage,
})

function LoginPage() {
  const { redirect: redirectTo, worker: workerLanding } = Route.useSearch()
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
    const target = safePostAuthPath(redirectTo)
    void navigate({ to: target, replace: true })
  }

  if (workerLanding) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-semibold text-fg">{t`Worker device`}</h1>
          <p className="mt-2 text-sm text-fg-secondary">
            {t`Kurulum linki işletme sahibiniz veya ekip sorumlunuz tarafından paylaşılır. SMS veya e-posta ile şifre yok; linkle tek seferlik cihaz eşleştirmesi yapılır.`}
          </p>
        </div>
        <p className="text-sm text-fg-secondary">
          {t`Sahip hesabıyla giriş:`}{' '}
          <a href="/login" className="font-medium text-orchard-500 underline-offset-2 hover:underline">
            {t`Sign in (owner)`}
          </a>
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold text-fg">{t`Owner sign-in`}</h1>
        <p className="mt-1 text-sm text-fg-secondary">{t`Work email and password.`}</p>
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-fg" htmlFor="lo-email">
            {t`Email`}
          </label>
          <input
            id="lo-email"
            name="email"
            type="email"
            autoComplete="email"
            className={formFieldClassName}
            value={values.email}
            onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-fg" htmlFor="lo-pass">
            {t`Password`}
          </label>
          <input
            id="lo-pass"
            name="password"
            type="password"
            autoComplete="current-password"
            className={formFieldClassName}
            value={values.password}
            onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
            required
          />
        </div>
        {formError ? <p className="text-sm text-harvest-500">{formError}</p> : null}
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? t`Signing in…` : t`Sign in`}
        </Button>
      </form>
      <p className="text-center text-sm text-fg-secondary">
        <Link
          to="/signup"
          search={{ redirect: redirectTo }}
          className="font-medium text-orchard-500 underline-offset-2 hover:underline"
        >
          {t`Create an account`}
        </Link>
      </p>
    </div>
  )
}
