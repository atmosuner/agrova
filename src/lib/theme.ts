/* eslint-disable lingui/no-unlocalized-strings -- key name only */
import type { Json } from '@/types/db'

const KEY = 'agrova-ui-theme'
export type AgrovaTheme = 'system' | 'light' | 'dark'

function prefersDark(): boolean {
  if (typeof globalThis.matchMedia === 'undefined') {
    return false
  }
  return globalThis.matchMedia('(prefers-color-scheme: dark)').matches
}

let mediaUnsub: (() => void) | null = null

export function applyThemeToDocument(theme: AgrovaTheme): void {
  if (typeof document === 'undefined') {
    return
  }
  if (mediaUnsub) {
    mediaUnsub()
    mediaUnsub = null
  }
  if (theme === 'dark') {
    document.documentElement.classList.add('dark')
    return
  }
  if (theme === 'light') {
    document.documentElement.classList.remove('dark')
    return
  }
  const sync = () => {
    if (prefersDark()) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }
  sync()
  const m = globalThis.matchMedia('(prefers-color-scheme: dark)')
  m.addEventListener('change', sync)
  mediaUnsub = () => m.removeEventListener('change', sync)
}

export function getStoredAgrovaTheme(): AgrovaTheme {
  try {
    const s = localStorage.getItem(KEY)
    if (s === 'light' || s === 'dark' || s === 'system') {
      return s
    }
  } catch {
    // ignore
  }
  return 'system'
}

export function setStoredAgrovaTheme(t: AgrovaTheme): void {
  try {
    localStorage.setItem(KEY, t)
  } catch {
    // ignore
  }
}

export function readThemeFromProfilePrefs(n: Json | null | undefined): AgrovaTheme | null {
  if (!n || typeof n !== 'object' || Array.isArray(n)) {
    return null
  }
  const t = n as { theme?: string }
  if (t.theme === 'light' || t.theme === 'dark' || t.theme === 'system') {
    return t.theme
  }
  return null
}

export function mergeNotificationPrefs(
  current: Json | null | undefined,
  patch: Record<string, Json | undefined>,
): Json {
  const base =
    current && typeof current === 'object' && !Array.isArray(current) ? (current as Record<string, Json>) : {}
  return { ...base, ...patch } as Json
}

export function readMutePush(prefs: Json | null | undefined): boolean {
  if (!prefs || typeof prefs !== 'object' || Array.isArray(prefs)) {
    return false
  }
  return Boolean((prefs as { push_muted?: boolean }).push_muted)
}
