/* eslint-disable lingui/no-unlocalized-strings */
import { msg, t, Trans } from '@lingui/macro'
import { useEffect, useRef, useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Users, RefreshCw, CheckCircle2, ArrowRight } from 'lucide-react'
import { i18n } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'

type ClaimError =
  | 'token_required'
  | 'invalid_or_expired_token'
  | 'owner_cannot_claim_setup'
  | 'person_inactive'
  | 'already_claimed'
  | 'token_expired'
  | 'network'
  | 'session_failed'
  | 'create_user_failed'
  | 'link_person_failed'
  | 'server_misconfigured'
  | 'unknown'

function mapBodyToError(
  res: Response,
  body: { error?: string } | null,
): { code: ClaimError; status: number } {
  const code = (body?.error as ClaimError) ?? 'unknown'
  if (res.status === 400 && code === 'token_expired') {
    return { code: 'token_expired', status: res.status }
  }
  if (res.status === 404) {
    return { code: 'invalid_or_expired_token', status: res.status }
  }
  if (res.status === 409) {
    return { code: 'already_claimed', status: res.status }
  }
  if (res.status === 403) {
    if (code === 'owner_cannot_claim_setup') {
      return { code: 'owner_cannot_claim_setup', status: res.status }
    }
    return { code: 'person_inactive', status: res.status }
  }
  if (res.status === 500) {
    if (code === 'server_misconfigured' || code === 'session_failed') {
      return { code, status: res.status }
    }
    if (code === 'create_user_failed' || code === 'link_person_failed') {
      return { code, status: res.status }
    }
  }
  return { code: 'unknown', status: res.status }
}

export const Route = createFileRoute('/setup/$token')({
  component: SetupPage,
})

type Phase = 'claiming' | 'success' | 'error'

function SetupPage() {
  const { token } = Route.useParams()
  const navigate = useNavigate()
  const [phase, setPhase] = useState<Phase>('claiming')
  const [err, setErr] = useState<ClaimError | null>(null)
  const didRun = useRef(false)

  useEffect(() => {
    if (didRun.current) {
      return
    }
    didRun.current = true
    let cancelled = false
    const run = async () => {
      if (!import.meta.env.VITE_SUPABASE_URL?.trim() || !import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()) {
        if (!cancelled) {
          setErr('server_misconfigured')
          setPhase('error')
        }
        return
      }
      setPhase('claiming')
      setErr(null)
      const url = `${import.meta.env.VITE_SUPABASE_URL.replace(/\/$/, '')}/functions/v1/claim-setup-token`
      const anon = import.meta.env.VITE_SUPABASE_ANON_KEY
      let res: Response
      try {
        res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${anon}`,
            apikey: anon,
          },
          body: JSON.stringify({ token }),
        })
      } catch {
        if (!cancelled) {
          setErr('network')
          setPhase('error')
        }
        return
      }
      const body = (await res.json().catch(() => null)) as
        | {
            error?: string
            access_token?: string
            refresh_token?: string
          }
        | null
      if (cancelled) {
        return
      }
      if (!res.ok || !body?.access_token || !body?.refresh_token) {
        setErr(mapBodyToError(res, body).code)
        setPhase('error')
        return
      }
      const { error: sessionErr } = await supabase.auth.setSession({
        access_token: body.access_token,
        refresh_token: body.refresh_token,
      })
      if (sessionErr) {
        setErr('session_failed')
        setPhase('error')
        return
      }
      if (!cancelled) {
        setPhase('success')
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [token])

  const heroTitle: Record<Phase, string> = {
    claiming: i18n._(msg`Cihaz kurulumu`),
    success: i18n._(msg`Kurulum tamamlandı`),
    error: i18n._(msg`Kurulum başarısız`),
  }
  const heroSub: Record<Phase, string> = {
    claiming: i18n._(msg`Oturumunuz hazırlanıyor — birkaç saniye sürer.`),
    success: i18n._(msg`Cihazınız hazır. Görevlerinize başlayabilirsiniz.`),
    error: i18n._(msg`Bağlantınızı kontrol ettik, bir sorun çıktı.`),
  }

  return (
    <div className="min-h-dvh bg-canvas">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col">
        {/* Hero band */}
        <div className="shrink-0 bg-orchard-500 px-6 pb-10 pt-12 text-white">
          <div className="flex flex-col items-center gap-3">
            <span
              aria-hidden
              className="inline-flex h-[72px] w-[72px] items-center justify-center rounded-full bg-white/15"
            >
              {phase === 'success' ? (
                <CheckCircle2 className="h-9 w-9 text-white" strokeWidth={1.75} />
              ) : (
                <Users className="h-9 w-9 text-white" strokeWidth={1.75} />
              )}
            </span>
            <h1 className="text-center text-2xl font-semibold leading-[1.2]">{heroTitle[phase]}</h1>
            <p className="text-center text-[15px] leading-[1.45] text-white/80">{heroSub[phase]}</p>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col p-6">
          {phase === 'claiming' ? <SetupClaiming /> : null}
          {phase === 'success' ? <SetupSuccess navigate={navigate} /> : null}
          {phase === 'error' && err ? <SetupError code={err} token={token} /> : null}

          <div className="mt-auto pt-6 text-center text-xs text-fg-faint">
            <Link to="/privacy" className="underline-offset-2 hover:underline">
              {t`Gizlilik (KVKK)`}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function SetupStep({
  n,
  children,
  active,
  done,
}: {
  n: number
  children: React.ReactNode
  active?: boolean
  done?: boolean
}) {
  return (
    <div className="mb-3 flex items-start gap-3 rounded-2xl border border-border bg-surface-0 px-4 py-3.5">
      <span
        className={
          done
            ? 'mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orchard-500 text-xs font-semibold text-white'
            : active
              ? 'mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-orchard-500/30 bg-orchard-50 text-xs font-semibold text-orchard-700'
              : 'mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-surface-1 text-xs font-semibold text-fg-muted'
        }
      >
        {done ? <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.5} /> : n}
      </span>
      <p className="text-[14px] leading-relaxed text-fg-secondary">{children}</p>
    </div>
  )
}

function SetupClaiming() {
  return (
    <div className="flex flex-col">
      <SetupStep n={1} active>
        <Trans>
          <strong className="font-medium text-fg">Cihaz hesabınız</strong> bağlanıyor.
        </Trans>
      </SetupStep>
      <SetupStep n={2}>
        <Trans>
          Sahibiniz tarafından verilen <strong className="font-medium text-fg">şifre</strong> ile giriş yapacaksınız.
        </Trans>
      </SetupStep>
      <SetupStep n={3}>
        <Trans>
          Görevler ekranı açılınca <strong className="font-medium text-fg">başlayabilirsiniz.</strong>
        </Trans>
      </SetupStep>
    </div>
  )
}

function SetupSuccess({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  return (
    <div className="flex flex-col" role="status">
      <SetupStep n={1} done>
        <Trans>
          <strong className="font-medium text-fg">Cihaz hesabınız</strong> bağlandı.
        </Trans>
      </SetupStep>
      <SetupStep n={2} done>
        <Trans>
          <strong className="font-medium text-fg">Oturumunuz</strong> oluşturuldu.
        </Trans>
      </SetupStep>
      <SetupStep n={3} done>
        <Trans>
          Görevleriniz <strong className="font-medium text-fg">hazır.</strong>
        </Trans>
      </SetupStep>
      <div className="mt-4">
        <button
          type="button"
          onClick={() => void navigate({ to: '/m/tasks', replace: true })}
          className="inline-flex h-[72px] w-full items-center justify-center gap-2 rounded-full bg-orchard-500 text-xl font-semibold text-white transition hover:bg-orchard-700 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-orchard-500 focus-visible:ring-offset-2"
          aria-label={i18n._(msg`Görevlerime git`)}
        >
          {t`Görevlerime Git`}
          <ArrowRight className="h-5 w-5" strokeWidth={2} aria-hidden />
        </button>
      </div>
    </div>
  )
}

function SetupError({ code, token }: { code: ClaimError; token: string }) {
  return (
    <div className="flex flex-col">
      <div className="mb-4 rounded-2xl border border-status-blocked/15 bg-status-blocked/[0.06] p-4 text-[14px] leading-relaxed text-fg-secondary">
        {code === 'token_expired' || code === 'invalid_or_expired_token' ? (
          <Trans>Link geçersiz veya süresi dolmuş. Sahibinizden yeni bir kurulum linki isteyin.</Trans>
        ) : null}
        {code === 'already_claimed' ? (
          <Trans>Bu link daha önce kullanılmış. Cihazınız bu ekiple zaten eşlendi. Profilden çıkış yapıp tekrar deneyin.</Trans>
        ) : null}
        {code === 'owner_cannot_claim_setup' ? (
          <Trans>Sahip hesapları cihaz kurulum linkiyle giriş yapamaz.</Trans>
        ) : null}
        {code === 'person_inactive' ? (
          <Trans>Bu ekip üyesi pasif. Yardım için işletme sahibiyle iletişime geçin.</Trans>
        ) : null}
        {code === 'network' ? (
          <Trans>İnternet bağlantısı yok. Bağlandıktan sonra yenileyin.</Trans>
        ) : null}
        {code === 'session_failed' ||
        code === 'server_misconfigured' ||
        code === 'create_user_failed' ||
        code === 'link_person_failed' ? (
          <Trans>Bir sunucu hatası oluştu. Daha sonra yeniden deneyin.</Trans>
        ) : null}
        {code === 'unknown' ? (
          <Trans>
            Hata: <span className="font-mono text-fg-muted">{code}</span>
          </Trans>
        ) : null}
      </div>
      <p className="mb-6 break-all font-mono text-[11px] text-fg-faint" aria-hidden>
        {token}
      </p>
      <button
        type="button"
        onClick={() => location.reload()}
        className="inline-flex h-[72px] w-full items-center justify-center gap-2 rounded-full bg-orchard-500 text-xl font-semibold text-white transition hover:bg-orchard-700 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-orchard-500 focus-visible:ring-offset-2"
      >
        <RefreshCw className="h-5 w-5" strokeWidth={2} aria-hidden />
        {t`Yenile`}
      </button>
    </div>
  )
}
