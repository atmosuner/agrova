import { t } from '@lingui/macro'
import { useState } from 'react'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { isWorkerUser } from '@/lib/auth-worker'
import { getSiteUrl } from '@/lib/site-url'
import { supabase } from '@/lib/supabase'
import { formFieldClassName } from '@/lib/form-field-class'
import { z } from 'zod'

/* eslint-disable lingui/no-unlocalized-strings -- zod + device domain; TR fixed strings */
const forgotSchema = z.object({
  email: z.string().trim().email({ message: 'Geçerli bir e-posta girin.' }),
})

export const Route = createFileRoute('/forgot-password')({
  beforeLoad: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (session) {
      if (isWorkerUser(session.user)) {
        throw redirect({ to: '/m/tasks' })
      }
      throw redirect({ to: '/today' })
    }
  },
  component: ForgotPasswordPage,
})

function isSyntheticDeviceEmail(email: string) {
  return email.trim().toLowerCase().endsWith('@device.agrova.app')
}
/* eslint-enable lingui/no-unlocalized-strings */

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [sending, setSending] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    const parsed = forgotSchema.safeParse({ email })
    if (!parsed.success) {
      setErr(parsed.error.issues[0]?.message ?? t`Formu kontrol edin.`)
      return
    }
    if (isSyntheticDeviceEmail(parsed.data.email)) {
      setErr(
        t`Cihaz hesapları (@device) için e-posta ile sıfırlama yok. İşletme sahibinden yeni şifre isteyin (Ekip) veya giriş yaptıysanız Profil’den şifre değiştirin.`,
      )
      return
    }
    const site = getSiteUrl()
    if (!site) {
      setErr(t`Yapılandırma hatası: site adresi (VITE_SITE_URL) tanımlı değil.`)
      return
    }
    setSending(true)
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${site}/reset-password`,
    })
    setSending(false)
    if (error) {
      setErr(error.message)
      return
    }
    setDone(true)
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold text-fg">{t`Reset password`}</h1>
        <p className="mt-2 text-sm text-fg-secondary">
          {t`We’ll send a link to your work email. Use the same address as your Agrova owner account.`}
        </p>
      </div>
      {done ? (
        <p className="text-sm text-orchard-700" role="status">
          {t`If an account exists for that address, you’ll receive an email with a link. Check spam.`}
        </p>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-fg" htmlFor="fp-email">
              {t`Email`}
            </label>
            <input
              id="fp-email"
              type="email"
              autoComplete="email"
              className={formFieldClassName}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {err ? <p className="text-sm text-harvest-500">{err}</p> : null}
          <Button type="submit" disabled={sending} className="w-full">
            {sending ? t`Sending…` : t`Send link`}
          </Button>
        </form>
      )}
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
