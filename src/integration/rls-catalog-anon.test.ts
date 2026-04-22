import { createClient } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'
import type { Database } from '@/types/db'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

const isPlaceholder =
  !url ||
  url.includes('dev-placeholder-not-a-real-project') ||
  url.includes('YOUR_PROJECT_REF')

const runIntegration = Boolean(url && anon && !isPlaceholder)

function assertRlsBlocks(error: { message: string; code?: string; details?: string } | null) {
  expect(error, 'expected insert to fail (anon has no write policy)').not.toBeNull()
  if (!error) return
  const stack = [error.message, error.code, error.details].filter(Boolean).join(' ')
  expect(
    /row-level security|rls|policy|permission|42501|not authorized|JWT|forbidden|Must be|violates|denied|anon/i.test(
      stack
    )
  ).toBe(true)
}

describe('M1-12: catalog RLS — anon cannot write', () => {
  const t = runIntegration ? it : it.skip

  t('rejects insert into people', async () => {
    const supabase = createClient<Database>(url!, anon!, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })
    const { error } = await supabase.from('people').insert({
      full_name: 'rls integration probe',
      phone: '+905551234500',
      role: 'WORKER',
    })
    assertRlsBlocks(error)
  })

  t('rejects insert into equipment', async () => {
    const supabase = createClient<Database>(url!, anon!, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })
    const { error } = await supabase.from('equipment').insert({
      name: 'rls equipment probe',
      category: 'TOOL',
    })
    assertRlsBlocks(error)
  })
})
