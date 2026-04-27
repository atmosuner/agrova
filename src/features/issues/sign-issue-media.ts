/* eslint-disable lingui/no-unlocalized-strings -- storage paths / query keys, not UI */
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

const TTL_SEC = 3600
const STALE_MS = 50 * 60 * 1000 // 50 min — well within the 1 h signed-URL TTL
const GC_MS = 60 * 60 * 1000

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

/**
 * React-Query backed hook that caches a signed Supabase storage URL.
 * The URL is fetched once and reused for 50 min (staleTime), then
 * garbage-collected after 60 min (gcTime).
 */
export function useSignedUrl(storagePath: string | null | undefined) {
  return useQuery({
    queryKey: ['signed-url', storagePath],
    enabled: Boolean(storagePath),
    queryFn: () => signIssueObjectUrl(storagePath!),
    staleTime: STALE_MS,
    gcTime: GC_MS,
  })
}
