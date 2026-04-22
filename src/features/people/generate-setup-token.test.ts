import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildSetupPageUrl, generateUrlSafeToken32 } from '@/features/people/generate-setup-token'

describe('generateUrlSafeToken32', () => {
  it('returns 32 URL-safe chars', () => {
    const t = generateUrlSafeToken32()
    expect(t).toMatch(/^[A-Za-z0-9_-]{32,44}$/)
    expect(t).not.toContain('+')
    expect(t).not.toContain('/')
    expect(t).not.toContain('=')
  })
})

describe('buildSetupPageUrl', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('uses path only when window is undefined (SSR / Node)', () => {
    expect(buildSetupPageUrl('abc123')).toBe('/setup/abc123')
  })

  it('uses origin when window is defined', () => {
    vi.stubGlobal('window', { location: { origin: 'https://orchard.example' } })
    expect(buildSetupPageUrl('xyz')).toBe('https://orchard.example/setup/xyz')
  })
})
