// @vitest-environment jsdom
import { render, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { RegisterOwnerWebPush } from '@/features/notifications/RegisterOwnerWebPush'

const registerMock = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))

vi.mock('@/features/notifications/register-web-push', () => ({
  registerWebPushIfPossible: registerMock,
}))

vi.mock('@/features/people/useMyPersonQuery', () => ({
  useMyPersonQuery: vi.fn(),
}))

import { useMyPersonQuery } from '@/features/people/useMyPersonQuery'

describe('RegisterOwnerWebPush', () => {
  afterEach(() => {
    registerMock.mockClear()
    vi.mocked(useMyPersonQuery).mockReset()
  })

  it('calls registerWebPushIfPossible for OWNER when person is loaded', async () => {
    vi.mocked(useMyPersonQuery).mockReturnValue({
      data: { id: 'owner-person', role: 'OWNER' },
      isSuccess: true,
    } as ReturnType<typeof useMyPersonQuery>)

    render(<RegisterOwnerWebPush />)

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledTimes(1)
    })
    expect(registerMock.mock.calls[0]?.[1]).toBe('owner-person')
  })

  it('does not register for non-owner roles', () => {
    vi.mocked(useMyPersonQuery).mockReturnValue({
      data: { id: 'worker-person', role: 'WORKER' },
      isSuccess: true,
    } as ReturnType<typeof useMyPersonQuery>)

    render(<RegisterOwnerWebPush />)

    expect(registerMock).not.toHaveBeenCalled()
  })
})
