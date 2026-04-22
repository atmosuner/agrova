/* eslint-disable lingui/no-unlocalized-strings -- TR user messages for toasts (same as create-team-person maps) */
import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

type ErrBody = { error?: string; message?: string; field?: string; reason?: string }

type FnSuccessBody = { email?: string; ok?: boolean; error?: string }

export function mapTeamPersonEmailError(
  status: number,
  body: ErrBody | null,
): string {
  if (status === 401) {
    return 'Oturum gerekli. Yeniden giriş yapın.'
  }
  if (status === 403) {
    return 'Bu işlem yalnızca işletme sahibi için veya bu kişi için uygulanamaz.'
  }
  if (status === 404) {
    return 'Kayıt bulunamadı.'
  }
  if (status === 409 || body?.error === 'email_taken') {
    return 'Bu e-posta zaten kayıtlı.'
  }
  if (body?.error === 'validation_failed' && body?.field === 'email') {
    return 'Geçerli bir e-posta girin.'
  }
  if (body?.error === 'get_failed') {
    return 'Giriş e-postası alınamadı. Daha sonra yeniden deneyin.'
  }
  if (body?.message) {
    return body.message
  }
  return 'E-posta güncellenemedi. Daha sonra yeniden deneyin.'
}

type GetBody = { op: 'get'; personId: string }
type SetBody = { op: 'set'; personId: string; email: string }

export async function getTeamPersonLoginEmail(
  input: { personId: string },
): Promise<{ ok: true; value: { email: string } } | { ok: false; message: string }> {
  await supabase.auth.refreshSession()
  const { data: { user }, error: uErr } = await supabase.auth.getUser()
  if (uErr || !user) {
    return { ok: false, message: mapTeamPersonEmailError(401, null) }
  }
  const { data, error: fnError } = await supabase.functions.invoke<FnSuccessBody>(
    'team-person-email',
    { body: { op: 'get', personId: input.personId } satisfies GetBody },
  )
  if (fnError) {
    if (fnError instanceof FunctionsHttpError) {
      const res = fnError.context as Response
      const errBody = (await res.json().catch(() => null)) as ErrBody | null
      return { ok: false, message: mapTeamPersonEmailError(res.status, errBody) }
    }
    return { ok: false, message: mapTeamPersonEmailError(500, null) }
  }
  if (typeof data?.email === 'string') {
    return { ok: true, value: { email: data.email } }
  }
  return { ok: false, message: mapTeamPersonEmailError(500, data ?? null) }
}

export async function setTeamPersonLoginEmailByOwner(input: {
  personId: string
  email: string
}): Promise<{ ok: true; value: { email: string } } | { ok: false; message: string }> {
  await supabase.auth.refreshSession()
  const { data: { user }, error: uErr } = await supabase.auth.getUser()
  if (uErr || !user) {
    return { ok: false, message: mapTeamPersonEmailError(401, null) }
  }
  const { data, error: fnError } = await supabase.functions.invoke<FnSuccessBody>(
    'team-person-email',
    { body: { op: 'set', personId: input.personId, email: input.email } satisfies SetBody },
  )
  if (fnError) {
    if (fnError instanceof FunctionsHttpError) {
      const res = fnError.context as Response
      const errBody = (await res.json().catch(() => null)) as ErrBody | null
      return { ok: false, message: mapTeamPersonEmailError(res.status, errBody) }
    }
    return { ok: false, message: mapTeamPersonEmailError(500, null) }
  }
  if (data?.ok && typeof data?.email === 'string') {
    return { ok: true, value: { email: data.email } }
  }
  return { ok: false, message: mapTeamPersonEmailError(500, data ?? null) }
}
