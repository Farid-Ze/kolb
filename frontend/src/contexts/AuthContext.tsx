import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LOGIN_ROUTE } from '../core/auth/routes';

/**
 * KLSI 4.0 - AuthContext
 * Manajemen state autentikasi global dengan listener onAuthStateChanged
 * Task 12-13: AuthContext dan useAuth hook
 * Guidelines.md §6: SSOT architecture
 */

export type Role = 'STUDENT' | 'MEDIATOR' | 'ADMIN';

interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  setAuthData: (token: string, userData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setAccessToken(storedToken);
          setUser(normalizeUserRole(parsedUser));
          
          // Task 18: Verifikasi token masih valid dengan getCurrentUser
          try {
            const { getCurrentUser } = await import('../services/authService');
            const currentUser = normalizeUserRole(await getCurrentUser(storedToken));
            
            // Update user data if changed
            if (JSON.stringify(currentUser) !== storedUser) {
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

    initAuth();
  }, []);

  // Task 6: Listen to unauthorized events from apiHelper
  useEffect(() => {
    const handleUnauthorized = (event?: CustomEvent) => {
      logout();
      
        // Save current location for post-login redirect (but not if already on auth pages)
      const currentPath = window.location.pathname + window.location.search + window.location.hash;
      if (currentPath && !currentPath.startsWith('/auth/')) {
        sessionStorage.setItem('auth:postLoginRedirect', currentPath);
        
        // Build login URL with returnTo parameter for better UX
        const returnTo = encodeURIComponent(currentPath);
        const message = event?.detail?.message || 'Your session has expired. Please sign in again.';
        
        // Store error message for display on login page
        sessionStorage.setItem('auth:lastAuthErrorMessage', message);
        
        // Navigate to login with returnTo parameter
        window.location.href = `${LOGIN_ROUTE}?returnTo=${returnTo}`;
      } else {
        // Already on auth page, just navigate to login without returnTo
        window.location.href = LOGIN_ROUTE;
      }
    };    window.addEventListener('auth:unauthorized', handleUnauthorized as EventListener);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized as EventListener);
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
  const refreshToken = async () => {
    // TODO: Implementasi refresh token jika backend mendukung
    console.log('Refresh token not implemented yet');
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

export const normalizeUserRole = (userData: User): User => {
  const incoming = (userData?.role as string | undefined) ?? 'STUDENT';
  const normalizedRole: Role = incoming === 'MAHASISWA' ? 'STUDENT' : (incoming as Role);
  if (normalizedRole === userData.role) {
    return userData;
  }
  return {
    ...userData,
    role: normalizedRole,
  };
};
// Custom hook - React 19: use() API (TODO3.md Phase 4)
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};