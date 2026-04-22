import { describe, expect, it, vi, beforeEach } from 'vitest'
import { signOutAndClearLocalData } from '@/features/auth/logout'

const signOut = vi.hoisted(() => vi.fn().mockResolvedValue({ error: null }))
const dbDelete = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { signOut },
  },
}))

vi.mock('@/lib/db', () => ({
  db: { delete: dbDelete },
}))

describe('signOutAndClearLocalData', () => {
  beforeEach(() => {
    signOut.mockClear()
    dbDelete.mockClear()
  })

  it('calls supabase signOut and clears Dexie', async () => {
    await signOutAndClearLocalData()
    expect(signOut).toHaveBeenCalledOnce()
    expect(dbDelete).toHaveBeenCalledOnce()
  })

  it('ignores errors from Dexie delete after successful signOut', async () => {
    dbDelete.mockRejectedValueOnce(new Error('idb blocked'))
    await expect(signOutAndClearLocalData()).resolves.toBeUndefined()
    expect(signOut).toHaveBeenCalledOnce()
  })
})
