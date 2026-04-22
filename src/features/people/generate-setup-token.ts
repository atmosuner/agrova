/** 32 URL-safe characters (base64url of 24 bytes) for /setup/{token} */
export function generateUrlSafeToken32(): string {
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  const s = btoa(String.fromCharCode(...bytes))
  return s.replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

export function buildSetupPageUrl(setupToken: string): string {
  if (typeof window === 'undefined') {
    return `/setup/${setupToken}`
  }
  return `${window.location.origin}/setup/${setupToken}`
}
