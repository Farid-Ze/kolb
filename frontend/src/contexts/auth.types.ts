export type Role = 'STUDENT' | 'MEDIATOR' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  created_at: string;
}

export interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  setAuthData: (token: string, userData: User) => void;
}

export interface AuthUnauthorizedDetail {
  message?: string;
}
