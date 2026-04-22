/**
 * Prevent open redirects: only same-origin paths are allowed after login.
 */
export function safePostAuthPath(redirect: string | undefined): string {
  if (!redirect || typeof redirect !== 'string') {
    return '/today'
  }
  if (!redirect.startsWith('/') || redirect.startsWith('//')) {
    return '/today'
  }
  return redirect
}
