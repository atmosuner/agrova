/* eslint-disable lingui/no-unlocalized-strings -- TR toasts; Supabase returns English errors */
import { supabase } from '@/lib/supabase'

function mapSignInError(message: string): string {
  const lower = message.toLowerCase()
  if (
    lower.includes('invalid login') ||
    lower.includes('invalid email or password') ||
    lower.includes('invalid login credentials')
  ) {
    return 'Mevcut şifre hatalı.'
  }
  return message
}

/**
 * Re-authenticates, then sets a new password (logged-in account).
 */
export async function changeAccountPassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const email = user?.email
  if (!email) {
    return { ok: false, message: 'Oturum bulunamadı. Yeniden giriş yapın.' }
  }
  const { error: signErr } = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword,
  })
  if (signErr) {
    return { ok: false, message: mapSignInError(signErr.message) }
  }
  const { error: upErr } = await supabase.auth.updateUser({ password: newPassword })
  if (upErr) {
    return { ok: false, message: upErr.message }
  }
  return { ok: true }
}
