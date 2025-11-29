import { AuthService, type LoginRequest, type Token, type UserCreate, type UserOut, UsersService } from '../../shared/api/generated'

export async function login(payload: LoginRequest): Promise<Token> {
  return await AuthService.loginApiV1AuthLoginPost(payload)
}

export async function register(payload: UserCreate): Promise<UserOut> {
  return await AuthService.registerApiV1AuthRegisterPost(payload)
}

export async function fetchCurrentUser(): Promise<UserOut> {
  return await UsersService.getMeApiV1UsersMeGet()
}
