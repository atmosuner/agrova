/* eslint-disable lingui/no-unlocalized-strings -- storage paths, not UI */
import { supabase } from '@/lib/supabase'

const TTL_SEC = 3600

export async function signIssueObjectUrl(storagePath: string | null): Promise<string | null> {
  if (!storagePath?.trim()) {
    return null
  }
  const { data, error } = await supabase.storage.from('issue-photos').createSignedUrl(storagePath.trim(), TTL_SEC)
  if (error || !data?.signedUrl) {
    return null
  }
  return data.signedUrl
}
