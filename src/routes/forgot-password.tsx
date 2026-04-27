import { msg, t } from '@lingui/macro'
import { useState } from 'react'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { Send } from 'lucide-react'
import {
  AuthErrorMessage,
  AuthShell,
  authInputClassName,
  authPrimaryButtonClassName,
} from '@/components/layout/AuthShell'
import { resolveAppShellForUser } from '@/features/auth/resolve-app-shell'
import { i18n } from '@/lib/i18n'
import { getSiteUrl } from '@/lib/site-url'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
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
      const shell = await resolveAppShellForUser(session.user)
      if (shell === 'worker') {
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
    <AuthShell
      title={i18n._(msg`Şifre sıfırla`)}
      subtitle={i18n._(msg`E-posta adresinize bağlantı göndereceğiz.`)}
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
      {done ? (
        <div role="status" className="flex flex-col items-center gap-3 text-center">
          <span
            aria-hidden
            className="inline-flex h-16 w-16 items-center justify-center rounded-full border-2 border-orchard-500/20 bg-orchard-50"
          >
            <Send className="h-7 w-7 text-orchard-500" strokeWidth={2} />
          </span>
          <p className="text-lg font-semibold text-fg">{i18n._(msg`Bağlantı gönderildi`)}</p>
          <p className="text-[14px] leading-relaxed text-fg-secondary">
            {i18n._(msg`Gelen kutunuzu kontrol edin. Birkaç dakika içinde ulaşmadıysa spam klasörüne bakın.`)}
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-fg" htmlFor="fp-email">
              {i18n._(msg`E-posta`)}
            </label>
            <input
              id="fp-email"
              type="email"
              autoComplete="email"
              placeholder="kemal@ciftlik.com.tr"
              className={authInputClassName}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {err ? <AuthErrorMessage>{err}</AuthErrorMessage> : null}
          <button type="submit" className={cn(authPrimaryButtonClassName, 'mt-1')} disabled={sending}>
            {sending ? t`Gönderiliyor…` : t`Sıfırlama bağlantısı gönder`}
          </button>
        </form>
      )}
    </AuthShell>
  )
}
