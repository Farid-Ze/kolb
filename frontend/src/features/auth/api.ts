import { apiClient } from '../../shared/api/client'
import type { User } from '../../entities/user/model'
import type { LoginRequest, RegisterRequest, TokenResponse } from './model'

export async function login(payload: LoginRequest): Promise<TokenResponse> {
  const { data } = await apiClient.post<TokenResponse>('/auth/login', payload)
  return data
}

export async function register(payload: RegisterRequest): Promise<User> {
  const { data } = await apiClient.post<User>('/auth/register', payload)
  return data
}

export async function fetchCurrentUser(): Promise<User> {
  const { data } = await apiClient.get<User>('/users/me')
  return data
}
