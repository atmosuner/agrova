/**
 * Read PostGIS/GeoJSON point from `fields.gps_center` (geography) for CSV export.
 */
export function gpsCenterToLatLng(gps: unknown): { lat: string; lng: string } {
  if (gps == null) {
    return { lat: '', lng: '' }
  }
  if (typeof gps === 'string') {
    try {
      return gpsCenterToLatLng(JSON.parse(gps) as unknown)
    } catch {
      return { lat: '', lng: '' }
    }
  }
  if (typeof gps !== 'object' || gps === null) {
    return { lat: '', lng: '' }
  }
  const o = gps as { type?: string; coordinates?: unknown }
  if (o.type === 'Point' && Array.isArray(o.coordinates) && o.coordinates.length >= 2) {
    const lng = o.coordinates[0]
    const lat = o.coordinates[1]
    if (typeof lat === 'number' && typeof lng === 'number') {
      return { lat: String(lat), lng: String(lng) }
    }
  }
  return { lat: '', lng: '' }
}
