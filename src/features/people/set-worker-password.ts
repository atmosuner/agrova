/* eslint-disable lingui/no-unlocalized-strings -- TR user messages for toasts (same as create-team-person maps) */
import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

type SetWorkerErrBody = { error?: string; message?: string; field?: string; reason?: string }

export function mapSetWorkerPasswordError(
  status: number,
  body: SetWorkerErrBody | null,
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
  if (body?.error === 'validation_failed' && body?.field === 'password') {
    return 'Şifre en az 8, en fazla 72 karakter olmalı.'
  }
  if (body?.message) {
    return body.message
  }
  return 'Şifre güncellenemedi. Daha sonra yeniden deneyin.'
}

export async function setWorkerPasswordByOwner(input: {
  personId: string
  newPassword: string
}): Promise<{ ok: true } | { ok: false; message: string }> {
  await supabase.auth.refreshSession()
  const { data: { user }, error: uErr } = await supabase.auth.getUser()
  if (uErr || !user) {
    return { ok: false, message: mapSetWorkerPasswordError(401, null) }
  }
  const { error: fnError } = await supabase.functions.invoke<Record<string, unknown>>(
    'set-worker-password',
    { body: { personId: input.personId, newPassword: input.newPassword } },
  )
  if (fnError) {
    if (fnError instanceof FunctionsHttpError) {
      const res = fnError.context as Response
      const errBody = (await res.json().catch(() => null)) as SetWorkerErrBody | null
      return { ok: false, message: mapSetWorkerPasswordError(res.status, errBody) }
    }
    return { ok: false, message: mapSetWorkerPasswordError(500, null) }
  }
  return { ok: true }
}
