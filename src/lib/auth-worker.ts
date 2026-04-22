/* eslint-disable lingui/no-unlocalized-strings */
import type { User } from '@supabase/supabase-js'

/** Worker devices use synthetic emails from claim-setup-token. */
export function isWorkerUser(user: User | null | undefined): boolean {
  const email = user?.email
  if (!email) {
    return false
  }
  return email.toLowerCase().endsWith('@device.agrova.app')
}
