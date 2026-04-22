import { beforeEach, describe, expect, it, vi } from 'vitest'

const { downloadUnparse } = vi.hoisted(() => ({ downloadUnparse: vi.fn() }))
vi.mock('@/lib/csv-download', () => ({ downloadUnparse }))

import { downloadEquipmentCsv } from './csv'
import type { Tables } from '@/types/db'

describe('downloadEquipmentCsv', () => {
  beforeEach(() => {
    downloadUnparse.mockClear()
  })

  it('calls downloadUnparse with category and name', () => {
    const row: Tables<'equipment'> = {
      id: 'e1',
      name: 'Testere',
      category: 'TOOL',
      notes: 'x',
      active: true,
      created_at: '2020-01-01T00:00:00Z',
      updated_at: '2020-01-01T00:00:00Z',
    }
    downloadEquipmentCsv([row])
    expect(downloadUnparse).toHaveBeenCalledOnce()
    const [data, prefix] = downloadUnparse.mock.calls[0]!
    expect(prefix).toBe('equipment')
    expect(data[1]?.[0]).toBeDefined()
    expect(data[1]?.[1]).toBe('Testere')
  })
})
