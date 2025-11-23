import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { ThemeContext, type ThemeContextValue, type ThemeMode, type ThemePreference } from './ThemeContext'

interface ThemeProviderProps {
  children: ReactNode
}

const THEME_STORAGE_KEY = 'zenotika.theme-preference'

const readStoredPreference = (): ThemePreference => {
  if (typeof window === 'undefined') {
    return 'system'
  }
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored
  }
  return 'system'
}

const systemTheme = (): ThemeMode => {
  if (typeof window === 'undefined') {
    return 'light'
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => readStoredPreference())
  const [systemMode, setSystemMode] = useState<ThemeMode>(() => systemTheme())

  const resolvedTheme: ThemeMode = preference === 'system' ? systemMode : preference

  const persistPreference = useCallback((value: ThemePreference) => {
    setPreferenceState(value)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_STORAGE_KEY, value)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemMode(event.matches ? 'dark' : 'light')
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }
    const root = document.documentElement
    if (resolvedTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [resolvedTheme])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    const handleStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY && event.newValue) {
        const value = event.newValue as ThemePreference
        if (value === 'light' || value === 'dark' || value === 'system') {
          setPreferenceState(value)
        }
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const handlePreferenceChange = useCallback(
    (next: ThemePreference) => {
      persistPreference(next)
    },
    [persistPreference],
  )

  const toggleTheme = useCallback(() => {
    handlePreferenceChange(resolvedTheme === 'dark' ? 'light' : 'dark')
  }, [handlePreferenceChange, resolvedTheme])

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: resolvedTheme,
      preference,
      setPreference: handlePreferenceChange,
      toggleTheme,
    }),
    [handlePreferenceChange, preference, resolvedTheme, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
