import { t } from '@lingui/macro'
import { useState } from 'react'
import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { safePostAuthPath } from '@/features/auth/redirect'
import { signUpFormSchema, type SignUpFormValues } from '@/features/auth/validation'
import { formFieldClassName } from '@/lib/form-field-class'
import { supabase } from '@/lib/supabase'

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

export const Route = createFileRoute('/signup')({
  beforeLoad: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (session) {
      throw redirect({ to: '/today' })
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
  const [values, setValues] = useState<SignUpFormValues>({
    email: '',
    fullName: '',
    phone: '',
    password: '',
    passwordConfirm: '',
  })

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    setInfo(null)
    const parsed = signUpFormSchema.safeParse(values)
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? t`Formu kontrol edin.`)
      return
    }
    setSubmitting(true)
    const { email, password, fullName, phone } = parsed.data
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
    setInfo(t`E-postanızı onaylayın, ardından giriş yapın. (Geliştirme modunda e-posta onayı kapalıysa giriş sayfasını kullanın.)`)
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold text-fg">{t`Create owner account`}</h1>
        <p className="mt-1 text-sm text-fg-secondary">
          {t`Enter your work email and a phone in international format (E.164).`}
        </p>
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-fg" htmlFor="su-email">
            {t`Email`}
          </label>
          <input
            id="su-email"
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
          <label className="text-sm font-medium text-fg" htmlFor="su-name">
            {t`Full name`}
          </label>
          <input
            id="su-name"
            name="fullName"
            type="text"
            autoComplete="name"
            className={formFieldClassName}
            value={values.fullName}
            onChange={(e) => setValues((v) => ({ ...v, fullName: e.target.value }))}
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-fg" htmlFor="su-phone">
            {t`Phone (E.164)`}
          </label>
          <input
            id="su-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+905551234567"
            className={formFieldClassName}
            value={values.phone}
            onChange={(e) => setValues((v) => ({ ...v, phone: e.target.value }))}
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-fg" htmlFor="su-pass">
            {t`Password`}
          </label>
          <input
            id="su-pass"
            name="password"
            type="password"
            autoComplete="new-password"
            className={formFieldClassName}
            value={values.password}
            onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
            required
          />
          <p className="text-xs text-fg-muted">
            {t`At least 8 characters, including one number.`}
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-fg" htmlFor="su-pass2">
            {t`Confirm password`}
          </label>
          <input
            id="su-pass2"
            name="passwordConfirm"
            type="password"
            autoComplete="new-password"
            className={formFieldClassName}
            value={values.passwordConfirm}
            onChange={(e) => setValues((v) => ({ ...v, passwordConfirm: e.target.value }))}
            required
          />
        </div>
        {formError ? <p className="text-sm text-harvest-500">{formError}</p> : null}
        {info ? <p className="text-sm text-fg-secondary">{info}</p> : null}
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? t`Signing up…` : t`Sign up`}
        </Button>
      </form>
      <p className="text-center text-sm text-fg-secondary">
        <Link
          to="/login"
          search={{ redirect: redirectTo }}
          className="font-medium text-orchard-500 underline-offset-2 hover:underline"
        >
          {t`Already have an account? Sign in`}
        </Link>
      </p>
    </div>
  )
}
