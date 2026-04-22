/* eslint-disable lingui/no-unlocalized-strings -- config URLs/keys, not user-facing */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/db'

/** Valid-shaped defaults so the client can initialize before `.env` is configured; replace via env in all real deploys. */
const FALLBACK = {
  url: 'https://dev-placeholder-not-a-real-project.supabase.co',
  anon:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
} as const

const url = import.meta.env.VITE_SUPABASE_URL?.trim() || FALLBACK.url
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || FALLBACK.anon

if (import.meta.env.DEV) {
  const missing = [
    !import.meta.env.VITE_SUPABASE_URL?.trim() && 'VITE_SUPABASE_URL',
    !import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() && 'VITE_SUPABASE_ANON_KEY',
  ].filter(Boolean)
  if (missing.length > 0) {
    console.warn(
      `[agrova] Missing ${missing.join(' and ')}. Copy .env.example to .env, set values from Supabase Dashboard → Project Settings → API, then restart the dev server. Until then, auth/API calls will fail (unresolvable host).`
    )
  }
}

export const supabase: SupabaseClient<Database> = createClient<Database>(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
