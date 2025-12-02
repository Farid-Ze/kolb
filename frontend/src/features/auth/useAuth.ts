import { createContext, use } from 'react';
import type { UserOut, LoginRequest, UserCreate } from '@/shared/api/generated';

export interface AuthContextType {
    user: UserOut | null;
    isAuthenticated: boolean;
    isGuest: boolean;
    isLoading: boolean;
    login: (data: LoginRequest) => Promise<void>;
    register: (data: UserCreate) => Promise<void>;
    logout: () => void;
    loginAsGuest: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
    const context = use(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
