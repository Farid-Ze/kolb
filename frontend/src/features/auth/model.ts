import type { User } from '../../entities/user/model'

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  fullName: string
  email: string
  password: string
  nim?: string | null
  kelas?: string | null
  tahunMasuk?: number | null
}

export interface TokenResponse {
  accessToken: string
  tokenType: string
  expiresIn: number
}

export interface LoginSuccessPayload {
  token: TokenResponse
  user: User
}

export interface AuthState {
  user: User | null
  token: string | null
}

export interface AuthContextValue extends AuthState {
  isAuthenticated: boolean
  login: (payload: LoginSuccessPayload) => void
  logout: () => void
}
