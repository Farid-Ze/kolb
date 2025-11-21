import React, { useState, useEffect, ReactNode } from 'react';
import { LOGIN_ROUTE } from '../core/auth/routes';
import type {
  User,
  AuthContextType,
  AuthUnauthorizedDetail,
} from './auth.types';
import { AuthContext } from './auth-context';
import { normalizeUserRole, parseStoredUser, assertUser } from './authUtils';

/**
 * KLSI 4.0 - AuthContext
 * Manajemen state autentikasi global dengan listener onAuthStateChanged
 * Task 12-13: AuthContext dan useAuth hook
 * Guidelines.md §6: SSOT architecture
 */

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Inisialisasi: Cek token dari localStorage saat mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('accessToken');
      const storedUserRaw = localStorage.getItem('user');
      const storedUser = storedUserRaw ? parseStoredUser(storedUserRaw) : null;

      if (storedToken && storedUser) {
        try {
          setAccessToken(storedToken);
          setUser(normalizeUserRole(storedUser));
          
          // Task 18: Verifikasi token masih valid dengan getCurrentUser
          try {
            const { getCurrentUser } = await import('../services/authService');
            const rawCurrentUser = await getCurrentUser(storedToken);
            const currentUser = normalizeUserRole(assertUser(rawCurrentUser));
            
            // Update user data if changed
            if (JSON.stringify(currentUser) !== JSON.stringify(storedUser)) {
              setUser(currentUser);
              localStorage.setItem('user', JSON.stringify(currentUser));
            }
          } catch (verifyError) {
            // Token invalid atau expired, hapus auth state
            console.warn('Token verification failed:', verifyError);
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            setAccessToken(null);
            setUser(null);
          }
        } catch (error) {
          console.error('Failed to restore auth state:', error);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
        }
      }
      
      setIsLoading(false);
    };

    void initAuth();
  }, []);

  // Task 6: Listen to unauthorized events from apiHelper
  useEffect(() => {
    const handleUnauthorized = (event?: CustomEvent<AuthUnauthorizedDetail>) => {
      logout();
      const currentPath = window.location.pathname + window.location.search + window.location.hash;
      if (currentPath && !currentPath.startsWith('/auth/')) {
        sessionStorage.setItem('auth:postLoginRedirect', currentPath);
        const returnTo = encodeURIComponent(currentPath);
        const message = event?.detail?.message ?? 'Your session has expired. Please sign in again.';
        sessionStorage.setItem('auth:lastAuthErrorMessage', message);
        window.location.href = `${LOGIN_ROUTE}?returnTo=${returnTo}`;
      } else {
        window.location.href = LOGIN_ROUTE;
      }
    };

    const listener: EventListener = (event) => {
      handleUnauthorized(event as CustomEvent<AuthUnauthorizedDetail>);
    };

    window.addEventListener('auth:unauthorized', listener);
    return () => window.removeEventListener('auth:unauthorized', listener);
  }, []);

  // Login function - Task 16
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Import service dynamically to avoid circular dependencies
      const { loginWithEmail } = await import('../services/authService');
      
      const data = await loginWithEmail(email, password);
      const { access_token, user: userData } = data;

      const normalized = normalizeUserRole(userData);
      setAccessToken(access_token);
      setUser(normalized);

      // Persist ke localStorage
      localStorage.setItem('accessToken', access_token);
      localStorage.setItem('user', JSON.stringify(normalized));
    } catch (error) {
      // Log error untuk debugging (ini normal untuk validasi)
      if (error instanceof Error) {
        console.warn('[Auth] Login validation:', error.message);
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function - Task 18
  const logout = () => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  };

  // Refresh token function - placeholder
  const refreshToken = () => {
    console.info('Refresh token not implemented yet');
    return Promise.resolve();
  };

  // Set auth data function
  const setAuthData = (token: string, userData: User) => {
    const normalized = normalizeUserRole(userData);
    setAccessToken(token);
    setUser(normalized);
    localStorage.setItem('accessToken', token);
    localStorage.setItem('user', JSON.stringify(normalized));
  };

  const value: AuthContextType = {
    user,
    accessToken,
    isLoading,
    isAuthenticated: !!user && !!accessToken,
    login,
    logout,
    refreshToken,
    setAuthData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export type { Role, User, AuthContextType, AuthUnauthorizedDetail } from './auth.types';