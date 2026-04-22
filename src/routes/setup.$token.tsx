/* eslint-disable lingui/no-unlocalized-strings */
import { t, Trans } from '@lingui/macro'
import { useEffect, useRef, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
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

function SetupPage() {
  const { token } = Route.useParams()
  const navigate = useNavigate()
  const [phase, setPhase] = useState<'claiming' | 'error'>(`claiming`)
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
      void navigate({ to: '/m/tasks', replace: true })
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [navigate, token])

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4">
      {phase === 'claiming' ? (
        <>
          <h1 className="text-xl font-semibold text-fg">{t`Device setup`}</h1>
          <p className="text-sm text-fg-secondary">{t`Preparing your session…`}</p>
        </>
      ) : null}
      {phase === 'error' && err ? <SetupError code={err} token={token} /> : null}
    </div>
  )
}

function SetupError({ code, token }: { code: ClaimError; token: string }) {
  return (
    <div className="max-w-md text-center">
      <h1 className="text-xl font-semibold text-fg">{t`Kurulum başarısız`}</h1>
      <p className="mt-3 text-sm text-fg-secondary">
        {code === 'token_expired' || code === 'invalid_or_expired_token' ? (
          <Trans>Link geçersiz veya süresi dolmuş. Sahibinizden yeni bir kurulum linki isteyin.</Trans>
        ) : null}
        {code === 'already_claimed' ? (
          <Trans>Bu link daha önce kullanılmış. Cihazınız bu ekiple zaten eşlendi. Profilden çıkış yapıp tekrar deneyin.</Trans>
        ) : null}
        {code === 'owner_cannot_claim_setup' ? <Trans>Sahip hesapları cihaz kurulum linkiyle giriş yapamaz.</Trans> : null}
        {code === 'person_inactive' ? <Trans>Bu ekip üyesi pasif. Yardım için işletme sahibiyle iletişime geçin.</Trans> : null}
        {code === 'network' ? <Trans>İnternet bağlantısı yok. Bağlandıktan sonra yenileyin.</Trans> : null}
        {code === 'session_failed' || code === 'server_misconfigured' || code === 'create_user_failed' || code === 'link_person_failed' ? (
          <Trans>Bir sunucu hatası oluştu. Daha sonra yeniden deneyin.</Trans>
        ) : null}
        {code === 'unknown' ? (
          <Trans>
            Hata: <span className="font-mono text-fg-muted">{code}</span>
          </Trans>
        ) : null}
      </p>
      <p className="mt-2 break-all font-mono text-xs text-fg-faint" aria-hidden>
        {token}
      </p>
      <Button type="button" className="mt-6" variant="secondary" onClick={() => location.reload()}>
        {t`Yenile`}
      </Button>
    </div>
  )
}
