import { t } from '@lingui/macro'
import { useEffect, useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { newPasswordPairValuesSchema } from '@/features/auth/validation'
import { formFieldClassName } from '@/lib/form-field-class'
import { getSiteUrl } from '@/lib/site-url'
import { supabase } from '@/lib/supabase'

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
    void navigate({ to: '/login', search: { redirect: undefined, worker: false }, replace: true })
  }

  if (!getSiteUrl()) {
    return (
      <div className="mx-auto max-w-md px-4 py-8">
        <p className="text-harvest-600">{t`Yapılandırma hatası: VITE_SITE_URL tanımlı değil.`}</p>
      </div>
    )
  }

  if (!ready && !gaveUp) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-4 py-8">
        <p className="text-sm text-fg-secondary">{t`Checking your reset link…`}</p>
      </div>
    )
  }

  if (!ready && gaveUp) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-4 py-8">
        <p className="text-sm text-fg-secondary">
          {t`This link is invalid or expired. Request a new reset email, or open the link from the latest message.`}
        </p>
        <Link
          to="/forgot-password"
          className="text-sm font-medium text-orchard-500 underline-offset-2 hover:underline"
        >
          {t`Request reset email`}
        </Link>
        <p className="text-sm">
          <Link
            to="/login"
            search={{ redirect: undefined, worker: false }}
            className="text-orchard-500 underline-offset-2 hover:underline"
          >
            {t`Back to sign-in`}
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold text-fg">{t`Set a new password`}</h1>
        <p className="mt-1 text-sm text-fg-secondary">{t`Choose a strong password for your account.`}</p>
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-fg" htmlFor="rp1">
            {t`New password`}
          </label>
          <input
            id="rp1"
            type="password"
            autoComplete="new-password"
            className={formFieldClassName}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-fg" htmlFor="rp2">
            {t`Confirm new password`}
          </label>
          <input
            id="rp2"
            type="password"
            autoComplete="new-password"
            className={formFieldClassName}
            value={newPasswordConfirm}
            onChange={(e) => setNewPasswordConfirm(e.target.value)}
            required
          />
        </div>
        {err ? <p className="text-sm text-harvest-500">{err}</p> : null}
        <Button type="submit" disabled={saving} className="w-full">
          {saving ? t`Saving…` : t`Update password`}
        </Button>
      </form>
      <p className="text-center text-sm text-fg-secondary">
        <Link
          to="/login"
          search={{ redirect: undefined, worker: false }}
          className="font-medium text-orchard-500 underline-offset-2 hover:underline"
        >
          {t`Back to sign-in`}
        </Link>
      </p>
    </div>
  )
}
