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
})
