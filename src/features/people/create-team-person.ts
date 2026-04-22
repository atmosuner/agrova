/* eslint-disable lingui/no-unlocalized-strings -- TR user copy + HTTP header literals */
import { FunctionsHttpError } from '@supabase/supabase-js'
import type { TeamPersonAddFormValues } from '@/features/people/validation'
import { supabase } from '@/lib/supabase'

export type CreateTeamPersonResult = { personId: string; loginEmail: string }

type CreateFnBody = {
  error?: string
  message?: string
  field?: string
  personId?: string
  loginEmail?: string
}

const LOG = '[agrova/create-team-person]'

function devLog(phase: string, detail: Record<string, unknown> = {}) {
  if (import.meta.env.DEV) {
    console.info(LOG, phase, detail)
  }
}

export function mapCreateTeamPersonError(
  status: number,
  body: { error?: string; message?: string; field?: string } | null,
): string {
  if (status === 401) {
    return 'Oturum gerekli. Yeniden giriş yapın.'
  }
  if (status === 403) {
    return 'Bu işlem yalnızca işletme sahibi için.'
  }
  if (status === 409) {
    return 'Bu telefon numarası zaten kayıtlı.'
  }
  if (body?.error === 'validation_failed' && body?.field === 'password') {
    return 'Şifre en az 8, en fazla 72 karakter olmalı.'
  }
  if (body?.error === 'validation_failed') {
    return 'Formdaki alanları kontrol edin (telefon +90 5xx…).'
  }
  if (body?.message) {
    return body.message
  }
  return 'Kayıt oluşturulamadı. Daha sonra yeniden deneyin.'
}

/**
 * Create `people` row, Supabase Auth (device e-mail), and apply owner-chosen password.
 */
export async function createTeamPersonWithAuth(
  input: TeamPersonAddFormValues,
): Promise<{ ok: true; value: CreateTeamPersonResult } | { ok: false; message: string }> {
  const { data: afterRefresh, error: refreshErr } = await supabase.auth.refreshSession()
  devLog('refreshSession', {
    ok: !refreshErr,
    error: refreshErr?.message,
    hasSession: Boolean(afterRefresh.session?.access_token),
  })

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    devLog('getUser failed', {
      error: userError?.message,
      name: userError?.name,
      code: (userError as { code?: string } | undefined)?.code,
    })
    console.warn(LOG, 'Create aborted: not authenticated (getUser)')
    return { ok: false, message: mapCreateTeamPersonError(401, null) }
  }
  devLog('getUser ok', { userId: user.id })

  const { data, error: fnError } = await supabase.functions.invoke<CreateFnBody>('create-team-person', {
    body: {
      fullName: input.fullName,
      phone: input.phone,
      role: input.role,
      password: input.password,
    },
  })

  if (fnError) {
    if (fnError instanceof FunctionsHttpError) {
      const res = fnError.context as Response
      const errBody = (await res.json().catch(() => null)) as
        | { error?: string; message?: string; reason?: string; field?: string }
        | null
      devLog('functions.invoke http error', {
        status: res.status,
        statusText: res.statusText,
        error: errBody?.error,
        reason: errBody?.reason,
        field: errBody?.field,
        message: errBody?.message,
        fnMessage: fnError.message,
      })
      if (res.status === 401) {
        console.warn(
          LOG,
          'Edge returned 401. If `reason` is missing, the failure is often the API gateway (JWT) before the function runs. Check VITE_ env matches the project you signed into.',
          { reason: errBody?.reason, error: errBody?.error },
        )
      }
      return { ok: false, message: mapCreateTeamPersonError(res.status, errBody) }
    }
    devLog('functions.invoke other error', { name: fnError.name, message: fnError.message })
    console.warn(LOG, 'functions.invoke failed (non-HTTP)', fnError)
    return { ok: false, message: mapCreateTeamPersonError(500, null) }
  }

  if (!data?.personId || !data?.loginEmail) {
    devLog('success response missing personId/loginEmail', { data })
    return { ok: false, message: mapCreateTeamPersonError(500, data ?? null) }
  }
  devLog('ok', { personId: data.personId ? `${String(data.personId).slice(0, 8)}…` : undefined })
  return {
    ok: true,
    value: {
      personId: data.personId,
      loginEmail: data.loginEmail,
    },
  }
}
