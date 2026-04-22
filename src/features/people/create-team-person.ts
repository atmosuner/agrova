/* eslint-disable lingui/no-unlocalized-strings -- TR user copy + HTTP header literals */
import { buildSetupPageUrl } from '@/features/people/generate-setup-token'
import type { TeamPersonFormValues } from '@/features/people/validation'
import { supabase } from '@/lib/supabase'

export type CreateTeamPersonResult = { personId: string; setupUrl: string }

export function mapCreateTeamPersonError(status: number, body: { error?: string; message?: string } | null): string {
  if (status === 401) {
    return 'Oturum gerekli. Yeniden giriş yapın.'
  }
  if (status === 403) {
    return 'Bu işlem yalnızca işletme sahibi için.'
  }
  if (status === 409) {
    return 'Bu telefon numarası zaten kayıtlı.'
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
 * Create people row, Supabase Auth (device account), and a one-time /setup/… link (owner: Team).
 */
export async function createTeamPersonWithAuth(
  input: TeamPersonFormValues,
): Promise<{ ok: true; value: CreateTeamPersonResult } | { ok: false; message: string }> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.access_token) {
    return { ok: false, message: mapCreateTeamPersonError(401, null) }
  }
  const base = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim().replace(/\/$/, '') ?? ''
  const anon = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ?? ''
  if (!base || !anon) {
    return { ok: false, message: mapCreateTeamPersonError(500, { error: 'server_misconfigured' }) }
  }
  const res = await fetch(`${base}/functions/v1/create-team-person`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      apikey: anon,
    },
    body: JSON.stringify({
      fullName: input.fullName,
      phone: input.phone,
      role: input.role,
    }),
  })
  const body = (await res.json().catch(() => null)) as {
    error?: string
    message?: string
    personId?: string
    setupToken?: string
  } | null
  if (!res.ok || !body?.setupToken) {
    return {
      ok: false,
      message: mapCreateTeamPersonError(res.status, body),
    }
  }
  return {
    ok: true,
    value: {
      personId: body.personId as string,
      setupUrl: buildSetupPageUrl(body.setupToken),
    },
  }
}
