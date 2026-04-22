/* eslint-disable lingui/no-unlocalized-strings -- routing constants, not UI copy */
import type { User } from '@supabase/supabase-js'
import { isWorkerUser } from '@/lib/auth-worker'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/db'

type PersonRole = Database['public']['Tables']['people']['Row']['role']

/**
 * After login, route crew (non-OWNER) to the /m PWA. Do not rely on `@device.agrova.app`
 * — owners may set a real sign-in e-mail, but `people.role` stays the source of truth.
 */
export function shellFromPersonRole(role: PersonRole | null | undefined): 'owner' | 'worker' {
  if (role == null) {
    return 'owner'
  }
  if (role === 'OWNER') {
    return 'owner'
  }
  return 'worker'
}

/**
 * Prefer `people.role` from the DB. If the row is missing or the query errors, fall back
 * to the device-email heuristic (legacy device accounts only).
 */
export async function resolveAppShellForUser(user: User): Promise<'owner' | 'worker'> {
  const { data, error } = await supabase
    .from('people')
    .select('role')
    .eq('auth_user_id', user.id)
    .maybeSingle()
  if (error && import.meta.env.DEV) {
    console.warn('[resolveAppShell] people role lookup', error.message)
  }
  if (data?.role) {
    return shellFromPersonRole(data.role)
  }
  return isWorkerUser(user) ? 'worker' : 'owner'
}
