/* eslint-disable lingui/no-unlocalized-strings -- Open-Meteo API query parameters, not UI copy */
/**
 * Resolves a city/region name to WGS84 coordinates using Open-Meteo geocoding (no API key).
 */
export async function openMeteoGeocodeCity(
  city: string
): Promise<{ lat: number; lng: number } | null> {
  const q = city.trim()
  if (!q) {
    return null
  }
  const u = new URL('https://geocoding-api.open-meteo.com/v1/search')
  u.searchParams.set('name', q)
  u.searchParams.set('count', '1')
  u.searchParams.set('language', 'tr')
  u.searchParams.set('format', 'json')
  const r = await fetch(u.toString())
  if (!r.ok) {
    return null
  }
  const j = (await r.json()) as { results?: { latitude: number; longitude: number }[] }
  const f = j.results?.[0]
  if (f == null) {
    return null
  }
  return { lat: f.latitude, lng: f.longitude }
}

export const TURKEY_VIEW_CENTER: { lat: number; lng: number } = { lat: 39, lng: 35 }
