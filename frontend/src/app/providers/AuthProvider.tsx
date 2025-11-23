import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import type { User } from '../../entities/user/model'
import { fetchCurrentUser, login as loginApi } from '../../features/auth/api'
import type { LoginRequest } from '../../features/auth/model'
import { useAuthTokenMetadata } from '../../shared/hooks/useAuthToken'
import { AuthContext, type AuthContextValue } from './AuthContext'

const STORAGE_KEY = 'zenotika_token'
const TIMELOCK_THRESHOLD_MS = 45 * 60 * 1000

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY))
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const { expiresAt } = useAuthTokenMetadata(token)
  const remainingMs = expiresAt ? Math.max(0, expiresAt - now) : null
  const isTimeLocked = remainingMs !== null && remainingMs <= TIMELOCK_THRESHOLD_MS

  const setToken = useCallback((value: string | null) => {
    setTokenState(value)
    if (value) {
      localStorage.setItem(STORAGE_KEY, value)
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
  }, [setToken])

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
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
          logout()
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
      isTimeLocked,
      isAuthenticated: Boolean(token),
      isLoading,
      login: loginWithCredentials,
      refreshUser,
      logout,
    }),
    [token, user, expiresAt, remainingMs, isTimeLocked, isLoading, loginWithCredentials, refreshUser, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

