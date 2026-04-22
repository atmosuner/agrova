import { describe, expect, it } from 'vitest'
import { fieldBoundaryToGeometry, fieldToPolygonFeature, toGeoJsonFeature } from './boundary-geojson'
import type { Tables } from '@/types/db'

const poly: GeoJSON.Polygon = {
  type: 'Polygon',
  coordinates: [
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
      [0, 0],
    ],
  ],
}

describe('fieldBoundaryToGeometry', () => {
  it('returns null for null/undefined', () => {
    expect(fieldBoundaryToGeometry(null)).toBeNull()
    expect(fieldBoundaryToGeometry(undefined)).toBeNull()
  })

  it('parses JSON string to polygon', () => {
    expect(fieldBoundaryToGeometry(JSON.stringify(poly))).toEqual(poly)
  })

  it('returns null for invalid JSON string', () => {
    expect(fieldBoundaryToGeometry('{not json')).toBeNull()
  })

  it('accepts polygon object', () => {
    expect(fieldBoundaryToGeometry(poly)).toEqual(poly)
  })

  it('accepts multiPolygon', () => {
    const mp: GeoJSON.MultiPolygon = {
      type: 'MultiPolygon',
      coordinates: [poly.coordinates],
    }
    expect(fieldBoundaryToGeometry(mp)).toEqual(mp)
  })

  it('returns null for unknown types', () => {
    expect(fieldBoundaryToGeometry({ type: 'Point' })).toBeNull()
  })

  it('accepts object with coordinates array', () => {
    const loose = { coordinates: poly.coordinates }
    expect(fieldBoundaryToGeometry(loose as unknown)).toEqual(loose)
  })
})

describe('toGeoJsonFeature', () => {
  it('builds a Feature with properties', () => {
    const f = toGeoJsonFeature('id-1', 'Tarla 1', poly)
    expect(f).toEqual({
      type: 'Feature',
      properties: { id: 'id-1', name: 'Tarla 1' },
      geometry: poly,
    })
  })
})

describe('fieldToPolygonFeature', () => {
  it('returns null when boundary is missing', () => {
    const field = { boundary: null } as Tables<'fields'>
    expect(fieldToPolygonFeature(field)).toBeNull()
  })

  it('returns Feature when boundary is valid', () => {
    const field = {
      id: 'f1',
      boundary: poly,
    } as Tables<'fields'>
    const f = fieldToPolygonFeature(field)
    expect(f?.type).toBe('Feature')
    expect(f?.properties).toEqual({ id: 'f1' })
    expect(f?.geometry).toEqual(poly)
  })
})
