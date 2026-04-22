/* eslint-disable lingui/no-unlocalized-strings */
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/db'

export function useMyPersonQuery() {
  return useQuery({
    queryKey: ['me', 'person'],
    queryFn: async (): Promise<Tables<'people'> | null> => {
      const {
        data: { user },
        error: uErr,
      } = await supabase.auth.getUser()
      if (uErr) {
        throw uErr
      }
      if (!user) {
        return null
      }
      const { data, error } = await supabase
        .from('people')
        .select(
          'id, full_name, phone, role, active, auth_user_id, created_at, updated_at, notification_prefs, setup_token, setup_token_expires_at',
        )
        .eq('auth_user_id', user.id)
        .maybeSingle()
      if (error) {
        throw error
      }
      return data
    },
  })
}

export function firstNameFromFull(fullName: string | null | undefined): string {
  if (!fullName?.trim()) {
    return '—'
  }
  return fullName.trim().split(/\s+/)[0] ?? '—'
}
