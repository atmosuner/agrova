/**
 * Prevent open redirects: only same-origin paths are allowed after login.
 */
export function safePostAuthPath(redirect: string | undefined, opts?: { mode?: 'owner' | 'worker' }): string {
  const fallback = opts?.mode === 'worker' ? '/m/tasks' : '/today'
  if (!redirect || typeof redirect !== 'string') {
    return fallback
  }
  if (!redirect.startsWith('/') || redirect.startsWith('//')) {
    return fallback
  }
  return redirect
}
