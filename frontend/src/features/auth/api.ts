import { apiClient } from '../../shared/api/client'
import type { UserOut } from '../../shared/api/generated'
import type { LoginRequest, RegisterRequest, TokenResponse } from './model'

export async function login(payload: LoginRequest): Promise<TokenResponse> {
  const { data } = await apiClient.post<TokenResponse>('/auth/login', payload)
  return data
}

export async function register(payload: RegisterRequest): Promise<UserOut> {
  const { data } = await apiClient.post<UserOut>('/auth/register', payload)
  return data
}

export async function fetchCurrentUser(): Promise<UserOut> {
  const { data } = await apiClient.get<UserOut>('/users/me')
  return data
}
