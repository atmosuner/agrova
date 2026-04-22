import { afterEach, describe, expect, it, vi } from 'vitest'
import { openMeteoGeocodeCity, TURKEY_VIEW_CENTER } from './open-meteo-geocoding'

describe('openMeteoGeocodeCity', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('returns null for blank input', async () => {
    expect(await openMeteoGeocodeCity('   ')).toBeNull()
  })

  it('returns lat/lng from search API', async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [{ latitude: 36.9, longitude: 30.7 }],
      }),
    })
    vi.stubGlobal('fetch', fetch)
    const r = await openMeteoGeocodeCity('Antalya')
    expect(r).toEqual({ lat: 36.9, lng: 30.7 })
  })
})

describe('TURKEY_VIEW_CENTER', () => {
  it('is a valid fallback', () => {
    expect(TURKEY_VIEW_CENTER.lat).toBe(39)
    expect(TURKEY_VIEW_CENTER.lng).toBe(35)
  })
})
