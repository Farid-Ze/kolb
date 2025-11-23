import { createContext, useContext } from 'react'

import type { User } from '../../entities/user/model'
import type { LoginRequest } from '../../features/auth/model'

export type AuthContextValue = {
  token: string | null
  user: User | null
  expiresAt: number | null
  remainingMs: number | null
  tokenRole: string | null
  isMediator: boolean
  isTimeLocked: boolean
  isAuthenticated: boolean
  isLoading: boolean
  login: (payload: LoginRequest) => Promise<void>
  refreshUser: () => Promise<User | null>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}
