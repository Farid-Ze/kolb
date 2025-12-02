import { render, screen, act } from '@testing-library/react'
import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest'

import { AuthProvider } from './AuthProvider'
import { useAuthContext } from './AuthContext'

vi.mock('../../features/auth/api', () => ({
  fetchCurrentUser: vi.fn(() => new Promise(() => {})),
  login: vi.fn(),
}))

const STORAGE_KEY = 'zenotika_token'

function encodeSegment(value: object) {
  return window
    .btoa(JSON.stringify(value))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function buildToken(payload: Record<string, unknown>) {
  const header = encodeSegment({ alg: 'HS256', typ: 'JWT' })
  const body = encodeSegment(payload)
  return `${header}.${body}.signature`
}

function AuthProbe() {
  const { isAuthenticated, isTimeLocked, tokenRole, isMediator } = useAuthContext()
  return (
    <div>
      <span data-testid="auth-state">{String(isAuthenticated)}</span>
      <span data-testid="time-lock">{String(isTimeLocked)}</span>
      <span data-testid="token-role">{tokenRole ?? 'null'}</span>
      <span data-testid="is-mediator">{String(isMediator)}</span>
    </div>
  )
}

describe('AuthProvider time-lock enforcement', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it('logs out immediately when token is already inside the time-lock window', async () => {
    const now = new Date('2025-01-01T00:00:00Z')
    vi.setSystemTime(now)
    // 4 minutes from now (inside 5 min window)
    const expSeconds = Math.floor((now.getTime() + 4 * 60 * 1000) / 1000)
    localStorage.setItem(STORAGE_KEY, buildToken({ exp: expSeconds }))

    await act(async () => {
      render(
        <AuthProvider>
          <AuthProbe />
        </AuthProvider>,
      )
    })

    await act(async () => {})

    expect(screen.getByTestId('auth-state')).toHaveTextContent('false')
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('logs out once the time-lock threshold is reached for a longer-lived token', async () => {
    const now = new Date('2025-01-01T00:00:00Z')
    vi.setSystemTime(now)
    const expSeconds = Math.floor((now.getTime() + 2 * 60 * 60 * 1000) / 1000)
    localStorage.setItem(STORAGE_KEY, buildToken({ exp: expSeconds }))

    await act(async () => {
      render(
        <AuthProvider>
          <AuthProbe />
        </AuthProvider>,
      )
    })

    await act(async () => {})
    expect(screen.getByTestId('auth-state')).toHaveTextContent('true')

    // Threshold is 5 minutes. So we wait (2 hours - 5 minutes)
    const msUntilLock = (2 * 60 - 5) * 60 * 1000
    await act(async () => {
      vi.advanceTimersByTime(msUntilLock + 1000)
    })

    expect(screen.getByTestId('auth-state')).toHaveTextContent('false')
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('marks mediator role from JWT claims without waiting for profile', async () => {
    const now = new Date('2025-01-01T00:00:00Z')
    vi.setSystemTime(now)
    const expSeconds = Math.floor((now.getTime() + 2 * 60 * 60 * 1000) / 1000)
    const mediatorToken = buildToken({ exp: expSeconds, role: 'MEDIATOR' })
    localStorage.setItem(STORAGE_KEY, mediatorToken)

    await act(async () => {
      render(
        <AuthProvider>
          <AuthProbe />
        </AuthProvider>,
      )
    })

    await act(async () => {})

    expect(screen.getByTestId('token-role')).toHaveTextContent('MEDIATOR')
    expect(screen.getByTestId('is-mediator')).toHaveTextContent('true')
  })
})
