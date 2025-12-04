import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { fetchCurrentUser, login as loginApi } from '../../features/auth/api'
import type { LoginRequest } from '../../features/auth/model'
import { ApiError, OpenAPI, type UserOut } from '../../shared/api/generated'
import { useAuthTokenMetadata } from '../../shared/hooks/useAuthToken'
import { AuthContext, type AuthContextValue } from './AuthContext'
import { TOKEN_KEY } from '../../shared/api/client'

const TIMELOCK_THRESHOLD_MS = 5 * 60 * 1000

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setTokenState] = useState<string | null>(() => {
    const t = localStorage.getItem(TOKEN_KEY)
    if (t) OpenAPI.TOKEN = t
    return t
  })
  const [user, setUser] = useState<UserOut | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    // Update now periodically for time-lock calculation
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const { expiresAt, role: tokenRole } = useAuthTokenMetadata(token)
  const remainingMs = expiresAt ? Math.max(0, expiresAt - now) : null
  const isTimeLocked = remainingMs !== null && remainingMs <= TIMELOCK_THRESHOLD_MS
  const isMediator = (tokenRole === 'MEDIATOR') || (user?.role === 'MEDIATOR') || false

  const setToken = useCallback((value: string | null) => {
    setTokenState(value)
    if (value) {
      localStorage.setItem(TOKEN_KEY, value)
      OpenAPI.TOKEN = value
    } else {
      localStorage.removeItem(TOKEN_KEY)
      OpenAPI.TOKEN = undefined
    }
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
  }, [setToken])

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === TOKEN_KEY) {
        setTokenState(event.newValue)
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  useEffect(() => {
    if (!token) {
      setUser(null)
      return
    }

    let cancelled = false
    setIsLoading(true)

    fetchCurrentUser()
      .then((profile) => {
        if (!cancelled) {
          setUser(profile)
        }
      })
      .catch((error) => {
        console.error('Failed to fetch profile', error)
        if (!cancelled) {
          if (error instanceof ApiError && error.status === 401) {
            logout()
          }
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [token, logout])

  useEffect(() => {
    if (!token || !expiresAt) {
      return
    }
    if (isTimeLocked) {
      // If we are time-locked, we logout immediately to enforce fresh session
      logout()
      return
    }
    // Also set a timeout for the exact moment we cross the threshold
    const timeUntilLock = Math.max(0, (expiresAt - Date.now()) - TIMELOCK_THRESHOLD_MS)
    const timeoutId = window.setTimeout(() => {
      logout()
    }, timeUntilLock)
    return () => window.clearTimeout(timeoutId)
  }, [token, expiresAt, isTimeLocked, logout])

  const loginWithCredentials = useCallback(
    async (payload: LoginRequest) => {
      const response = await loginApi(payload)
      setToken(response.accessToken)
    },
    [setToken],
  )

  const refreshUser = useCallback(async () => {
    if (!token) {
      setUser(null)
      return null
    }
    setIsLoading(true)
    try {
      const profile = await fetchCurrentUser()
      setUser(profile)
      return profile
    } catch (error) {
      console.error('Failed to refresh profile', error)
      logout()
      return null
    } finally {
      setIsLoading(false)
    }
  }, [token, logout])

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      expiresAt,
      remainingMs,
      tokenRole,
      isMediator,
      isTimeLocked,
      isAuthenticated: Boolean(token),
      isLoading,
      login: loginWithCredentials,
      refreshUser,
      logout,
    }),
    [token, user, expiresAt, remainingMs, tokenRole, isMediator, isTimeLocked, isLoading, loginWithCredentials, refreshUser, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

