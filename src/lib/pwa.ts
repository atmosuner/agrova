/* eslint-disable lingui/no-unlocalized-strings -- localStorage keys, not product copy */
const PREF_KEY = 'agrova_install_prompt_dismissed_v1'
const WIDE_HINT_KEY = 'agrova_ios_pwa_hint_seen_v1'

export function isStandaloneDisplay(): boolean {
  return globalThis.matchMedia('(display-mode: standalone)').matches || (globalThis as unknown as { navigator: { standalone?: boolean } }).navigator.standalone === true
}

export function isLikelyIOSSafari(): boolean {
  if (typeof navigator === 'undefined') {
    return false
  }
  const ua = navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream
}

export function shouldShowIOSInstallHint(): boolean {
  if (isStandaloneDisplay() || !isLikelyIOSSafari()) {
    return false
  }
  try {
    return localStorage.getItem(WIDE_HINT_KEY) !== '1'
  } catch {
    return true
  }
}

export function markIOSInstallHintSeen(): void {
  try {
    localStorage.setItem(WIDE_HINT_KEY, '1')
  } catch {
    // ignore
  }
}

export function isInstallPromptDismissed(): boolean {
  try {
    return localStorage.getItem(PREF_KEY) === '1'
  } catch {
    return false
  }
}

export function setInstallPromptDismissed(): void {
  try {
    localStorage.setItem(PREF_KEY, '1')
  } catch {
    // ignore
  }
}

type BeforeInstallPrompt = Event & {
  readonly platforms: string[]
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferred: BeforeInstallPrompt | null = null

export function captureBeforeInstall(
  e: Event,
  opts: { isDismissed: () => boolean; isStandalone: () => boolean },
): BeforeInstallPrompt | null {
  if (opts.isDismissed() || opts.isStandalone()) {
    return null
  }
  e.preventDefault()
  deferred = e as BeforeInstallPrompt
  return deferred
}

export function getDeferredInstall(): BeforeInstallPrompt | null {
  return deferred
}

export function clearDeferredInstall(): void {
  deferred = null
}

export async function triggerInstallFromDeferred(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  const p = getDeferredInstall()
  if (!p) {
    return 'unavailable'
  }
  await p.prompt()
  const choice = await p.userChoice
  clearDeferredInstall()
  return choice.outcome
}
