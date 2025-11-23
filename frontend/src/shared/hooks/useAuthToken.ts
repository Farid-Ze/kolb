import { useMemo } from 'react'
import { jwtDecode } from 'jwt-decode'

interface TokenClaims {
  exp?: number
  sub?: string
  role?: string
  [key: string]: unknown
}

export function useAuthTokenMetadata(token: string | null) {
  return useMemo(() => {
    if (!token) {
      return { expiresAt: null, subject: null, role: null }
    }

    try {
      const claims = jwtDecode<TokenClaims>(token)
      const expiresAt = claims.exp ? claims.exp * 1000 : null
      const subject = typeof claims.sub === 'string' ? claims.sub : null
      const role = typeof claims.role === 'string' ? claims.role : null
      return { expiresAt, subject, role }
    } catch (error) {
      console.warn('Unable to decode token', error)
      return { expiresAt: null, subject: null, role: null }
    }
  }, [token])
}
