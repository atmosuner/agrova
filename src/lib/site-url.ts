/**
 * Public site origin for auth redirects (password recovery). Prefer `VITE_SITE_URL` in production
 * so it matches Supabase Auth → URL allow list exactly.
 */
export function getSiteUrl(): string {
  const fromEnv = import.meta.env.VITE_SITE_URL
  if (typeof fromEnv === 'string' && fromEnv.trim()) {
    return fromEnv.trim().replace(/\/$/, '')
  }
  if (typeof globalThis !== 'undefined' && typeof globalThis.location?.origin === 'string') {
    return globalThis.location.origin
  }
  return ''
}
