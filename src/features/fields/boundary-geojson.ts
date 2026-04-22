import type { Tables } from '@/types/db'

/**
 * PostgREST returns PostGIS geography as GeoJSON-like objects; normalize to a GeoJSON geometry.
 */
export function fieldBoundaryToGeometry(boundary: unknown): GeoJSON.Polygon | GeoJSON.MultiPolygon | null {
  if (boundary == null) {
    return null
  }
  if (typeof boundary === 'string') {
    try {
      const p = JSON.parse(boundary) as unknown
      return parsePolygonish(p)
    } catch {
      return null
    }
  }
  if (typeof boundary === 'object') {
    return parsePolygonish(boundary)
  }
  return null
}

function parsePolygonish(v: unknown): GeoJSON.Polygon | GeoJSON.MultiPolygon | null {
  if (v == null || typeof v !== 'object' || v === null) {
    return null
  }
  const o = v as { type?: string; coordinates?: unknown; crs?: unknown }
  if (o.type === 'Polygon' || o.type === 'MultiPolygon') {
    return o as GeoJSON.Polygon | GeoJSON.MultiPolygon
  }
  if ('coordinates' in o && Array.isArray((o as GeoJSON.Polygon).coordinates)) {
    return o as GeoJSON.Polygon | GeoJSON.MultiPolygon
  }
  return null
}

export function toGeoJsonFeature(
  fieldId: string,
  name: string,
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon
): GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon> {
  return {
    type: 'Feature',
    properties: { id: fieldId, name },
    geometry,
  }
}

/** GeoJSON Feature with polygon (or multi) for `field_upsert_from_geojson` */
export function fieldToPolygonFeature(field: Tables<'fields'>): GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon> | null {
  const g = fieldBoundaryToGeometry(field.boundary)
  if (g == null) {
    return null
  }
  return { type: 'Feature', properties: { id: field.id }, geometry: g }
}
