import { db } from '@/lib/db'
import { supabase } from '@/lib/supabase'

/**
 * Signs out of Supabase and clears the Dexie offline cache (outbox, blobs, etc.).
 * Use before navigating to `/login` for both owner and worker flows.
 */
export async function signOutAndClearLocalData(): Promise<void> {
  await supabase.auth.signOut()
  try {
    await db.delete()
  } catch {
    // best-effort: IDB may be unavailable in some environments
  }
}
