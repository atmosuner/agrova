import { beforeEach, describe, expect, it, vi } from 'vitest'

const { downloadUnparse } = vi.hoisted(() => ({ downloadUnparse: vi.fn() }))
vi.mock('@/lib/csv-download', () => ({ downloadUnparse }))

import { downloadFieldChemicalsCsv } from './field-chemical-csv'
import type { FieldChemicalRow } from './useFieldChemicalApplicationsQuery'

describe('downloadFieldChemicalsCsv', () => {
  beforeEach(() => {
    downloadUnparse.mockClear()
  })

  it('exports chemical rows with field-scoped filename', () => {
    const rows: FieldChemicalRow[] = [
      {
        id: 'c1',
        task_id: 't1',
        applied_at: '2026-04-20T10:00:00.000Z',
        task_activity: 'ilaçlama',
        applicator_name: 'Ali',
      },
    ]
    downloadFieldChemicalsCsv('Kuzey / Tarla-1', rows)
    expect(downloadUnparse).toHaveBeenCalledOnce()
    const [data, prefix] = downloadUnparse.mock.calls[0]!
    expect(prefix).toContain('field-chemicals-')
    expect(data[0]?.length).toBeGreaterThan(0)
    expect(data[1]?.[2]).toBe('ilaçlama')
  })
})
