import { beforeEach, describe, expect, it, vi } from 'vitest'

const { downloadUnparse } = vi.hoisted(() => ({ downloadUnparse: vi.fn() }))
vi.mock('@/lib/csv-download', () => ({ downloadUnparse }))

import { downloadFieldsCsv } from './csv'
import type { Tables } from '@/types/db'

describe('downloadFieldsCsv', () => {
  beforeEach(() => {
    downloadUnparse.mockClear()
  })

  it('calls downloadUnparse with columns from field row', () => {
    const row: Tables<'fields'> = {
      id: 'f1',
      name: 'Kuzey',
      address: null,
      crop: 'elma',
      variety: 'granny',
      area_hectares: 1.5,
      gps_center: '0101000020E61000000000000000F03F0000000000000000',
      boundary: null,
      plant_count: 100,
      planted_year: 2020,
      notes: 'not',
      created_at: '2020-01-01T00:00:00Z',
      updated_at: '2020-01-01T00:00:00Z',
    }
    downloadFieldsCsv([row])
    expect(downloadUnparse).toHaveBeenCalledOnce()
    const [data, prefix] = downloadUnparse.mock.calls[0]!
    expect(prefix).toBe('fields')
    expect(data[0]).toHaveLength(9)
    expect(data[1]?.[0]).toBe('Kuzey')
  })

  it('uses empty optional field columns and GeoJSON string gps_center', () => {
    const row: Tables<'fields'> = {
      id: 'f1',
      name: 'Güney',
      address: null,
      crop: 'armut',
      variety: null,
      area_hectares: null,
      gps_center: JSON.stringify({ type: 'Point', coordinates: [27.0, 38.0] }),
      boundary: null,
      plant_count: null,
      planted_year: null,
      notes: null,
      created_at: '2020-01-01T00:00:00Z',
      updated_at: '2020-01-01T00:00:00Z',
    }
    downloadFieldsCsv([row])
    const [data] = downloadUnparse.mock.calls[0]!
    const r1 = data[1] as (string | number)[]
    expect(r1[2]).toBe('')
    expect(r1[3]).toBe('')
    expect(r1[4]).toBe('38')
    expect(r1[5]).toBe('27')
  })
})
