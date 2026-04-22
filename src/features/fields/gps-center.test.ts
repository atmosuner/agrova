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
})
