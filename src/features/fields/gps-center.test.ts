import { describe, expect, it } from 'vitest'
import { gpsCenterToLatLng } from './gps-center'

describe('gpsCenterToLatLng', () => {
  it('parses GeoJSON Point', () => {
    expect(
      gpsCenterToLatLng({
        type: 'Point',
        coordinates: [30.5, 36.7],
      })
    ).toEqual({ lat: '36.7', lng: '30.5' })
  })

  it('returns empty on invalid', () => {
    expect(gpsCenterToLatLng(null)).toEqual({ lat: '', lng: '' })
  })

  it('returns empty for non-string primitives (not a GPS object)', () => {
    expect(gpsCenterToLatLng(0)).toEqual({ lat: '', lng: '' })
  })

  it('parses stringified GeoJSON', () => {
    expect(gpsCenterToLatLng('{"type":"Point","coordinates":[1,2]}')).toEqual({ lat: '2', lng: '1' })
  })

  it('returns empty for invalid JSON string', () => {
    expect(gpsCenterToLatLng('{')).toEqual({ lat: '', lng: '' })
  })

  it('returns empty for non-Point or bad coordinates', () => {
    expect(gpsCenterToLatLng({ type: 'LineString', coordinates: [] })).toEqual({ lat: '', lng: '' })
    expect(
      gpsCenterToLatLng({ type: 'Point', coordinates: ['a', 'b'] } as never),
    ).toEqual({ lat: '', lng: '' })
  })
})
