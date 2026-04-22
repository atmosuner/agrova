import { beforeEach, describe, expect, it, vi } from 'vitest'

const { downloadUnparse } = vi.hoisted(() => ({ downloadUnparse: vi.fn() }))
vi.mock('@/lib/csv-download', () => ({ downloadUnparse }))

import { downloadPeopleCsv } from './csv'
import type { Tables } from '@/types/db'

function person(over: Partial<Tables<'people'>> = {}): Tables<'people'> {
  return {
    id: 'p1',
    full_name: 'Ali',
    phone: '+905551112233',
    role: 'WORKER',
    active: true,
    auth_user_id: null,
    created_at: '2020-01-01T00:00:00Z',
    updated_at: '2020-01-01T00:00:00Z',
    notification_prefs: {},
    setup_token: null,
    setup_token_expires_at: null,
    ...over,
  }
}

describe('downloadPeopleCsv', () => {
  beforeEach(() => {
    downloadUnparse.mockClear()
  })

  it('calls downloadUnparse with header row and data', () => {
    downloadPeopleCsv([person()])
    expect(downloadUnparse).toHaveBeenCalledTimes(1)
    const [data, prefix] = downloadUnparse.mock.calls[0]!
    expect(prefix).toBe('people')
    expect(data[0]).toHaveLength(4)
    expect(data[1]?.[0]).toBe('Ali')
    expect(data[1]?.[1]).toBe('+905551112233')
  })

  it('maps archived state in last column', () => {
    downloadPeopleCsv([person({ active: false })])
    const [data] = downloadUnparse.mock.calls[0]!
    expect(data[1]?.[3]).toMatch(/Archived|Arşiv/i)
  })
})
