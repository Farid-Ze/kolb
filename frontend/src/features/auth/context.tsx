import { createContext, useState, useEffect, use, useCallback } from 'react';
import type { ReactNode } from 'react';
import { AuthService, UsersService } from '@/shared/api/generated';
import type { UserOut, LoginRequest, UserCreate } from '@/shared/api/generated';

interface AuthContextType {
    user: UserOut | null;
    isAuthenticated: boolean;
    isGuest: boolean;
    isLoading: boolean;
    login: (data: LoginRequest) => Promise<void>;
    register: (data: UserCreate) => Promise<void>;
    logout: () => void;
    loginAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserOut | null>(null);
    const [isGuest, setIsGuest] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUser = useCallback(async () => {
        try {
            const userProfile = await UsersService.getMeUsersMeGet();
            setUser(userProfile);
            setIsGuest(false);
        } catch (error) {
            console.error('Failed to fetch user profile', error);
            localStorage.removeItem('accessToken');
            setUser(null);
        }
    }, []);

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('accessToken');
            const guestToken = localStorage.getItem('guestToken');

            if (token) {
                await fetchUser();
            } else if (guestToken) {
                setIsGuest(true);
            }

            setIsLoading(false);
        };
        initAuth();
    }, [fetchUser]);

    const login = async (data: LoginRequest) => {
        const response = await AuthService.loginAuthLoginPost(data);
        // @ts-ignore - Token type might have access_token as snake_case or accessToken as camelCase depending on generator config
        // We assume access_token based on standard FastAPI OAuth2
        const token = response.access_token || response.accessToken;
        localStorage.setItem('accessToken', token);

        // Clear guest token on real login
        localStorage.removeItem('guestToken');
        await fetchUser();
    };

    const register = async (data: UserCreate) => {
        await AuthService.registerAuthRegisterPost(data);
        // After register, usually we redirect to login or auto-login.
        // For now, let the caller handle the next step (e.g. redirect).
    };

    const logout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('guestToken');
        setUser(null);
        setIsGuest(false);
        // Optional: Redirect to login
        window.location.href = '/login';
    };

    const loginAsGuest = () => {
        const guestToken = crypto.randomUUID();
        localStorage.setItem('guestToken', guestToken);
        setIsGuest(true);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user || isGuest,
            isGuest,
            isLoading,
            login,
            register,
            logout,
            loginAsGuest
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = use(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
