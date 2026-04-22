import { describe, expect, it } from 'vitest'
import { scaledDimensions } from '@/lib/image-compress'

describe('scaledDimensions', () => {
  it('returns original size when within max long edge', () => {
    expect(scaledDimensions(800, 600, 1600)).toEqual({ width: 800, height: 600 })
  })

  it('scales down when long edge exceeds max', () => {
    expect(scaledDimensions(3200, 800, 1600)).toEqual({ width: 1600, height: 400 })
    expect(scaledDimensions(800, 3200, 1600)).toEqual({ width: 400, height: 1600 })
  })

  it('never returns zero dimensions', () => {
    expect(scaledDimensions(1, 5000, 1600).width).toBeGreaterThanOrEqual(1)
    expect(scaledDimensions(1, 5000, 1600).height).toBeGreaterThanOrEqual(1)
  })
})
