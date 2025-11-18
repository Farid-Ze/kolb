/**
 * KLSI 4.0 - AuthService
 * Service layer untuk API autentikasi dengan fallback ke mock service
 * Task 16-17: AuthService untuk loginWithEmail dan getCurrentUser
 */

import { getApiUrl, API_CONFIG } from '../config/api';
import { apiCall } from '../utils/apiHelper';
import { mockLogin, mockRegister, mockGetCurrentUser } from './mockAuthService';

interface LoginResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: 'STUDENT' | 'MEDIATOR' | 'ADMIN';
    created_at: string;
  };
}

interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: 'STUDENT' | 'MEDIATOR' | 'ADMIN';
  created_at: string;
}

/**
 * Login dengan email dan password
 * POST /auth/login (sesuai frontend_readiness.md §7.2)
 * Auto-fallback ke mock service jika backend tidak tersedia
 */
export const loginWithEmail = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  // CRITICAL: Bulletproof whitespace handling
  const trimmedEmail = email.trim();
  const trimmedPassword = password.trim();
  
  console.log('[Mock Auth] Login attempt:', {
    email: trimmedEmail,
    passwordLength: trimmedPassword.length,
    passwordPreview: trimmedPassword.substring(0, 3) + '...'
  });
  
  try {
    // Try real API first
    const response = await apiCall<LoginResponse>(getApiUrl('/auth/login'), {
      method: 'POST',
      headers: API_CONFIG.headers,
      body: JSON.stringify({ 
        email: trimmedEmail, 
        password: trimmedPassword 
      }),
    });
    return response;
  } catch (error) {
    // If backend not available, use mock service
    const errorMessage = error instanceof Error ? error.message : '';
    if (
      errorMessage.includes('Not Found') ||
      errorMessage.includes('404') ||
      errorMessage.includes('Failed to fetch') ||
      errorMessage.includes('NetworkError')
    ) {
      console.info('🎭 Backend tidak tersedia, menggunakan Mock Auth Service');
      return await mockLogin(trimmedEmail, trimmedPassword);
    }
    // Re-throw other errors (like invalid credentials from real API)
    throw error;
  }
};

/**
 * Get current user info
 * GET /auth/me
 * Auto-fallback ke mock service jika backend tidak tersedia
 */
export const getCurrentUser = async (token: string): Promise<UserResponse> => {
  try {
    // Try real API first
    const response = await apiCall<UserResponse>(getApiUrl('/auth/me'), {
      method: 'GET',
      headers: {
        ...API_CONFIG.headers,
        'Authorization': `Bearer ${token}`,
      },
    });
    return response;
  } catch (error) {
    // If backend not available or mock token, use mock service
    const errorMessage = error instanceof Error ? error.message : '';
    if (
      token.startsWith('mock_token_') ||
      errorMessage.includes('Not Found') ||
      errorMessage.includes('404') ||
      errorMessage.includes('Failed to fetch')
    ) {
      console.info('🎭 Using Mock Auth Service for user info');
      return await mockGetCurrentUser(token);
    }
    throw error;
  }
};

/**
 * Register user
 * POST /auth/register
 * Auto-fallback ke mock service jika backend tidak tersedia
 */
export const registerUser = async (data: {
  email: string;
  password: string;
  name: string;
}): Promise<UserResponse> => {
  try {
    // Try real API first
    const response = await apiCall<UserResponse>(getApiUrl('/auth/register'), {
      method: 'POST',
      headers: API_CONFIG.headers,
      body: JSON.stringify(data),
    });
    return response;
  } catch (error) {
    // If backend not available, use mock service
    const errorMessage = error instanceof Error ? error.message : '';
    if (
      errorMessage.includes('Not Found') ||
      errorMessage.includes('404') ||
      errorMessage.includes('Failed to fetch')
    ) {
      console.info('🎭 Backend tidak tersedia, menggunakan Mock Auth Service');
      return await mockRegister(data);
    }
    throw error;
  }
};

/**
 * Check if using mock service
 */
export const isUsingMockService = (token: string | null): boolean => {
  return token?.startsWith('mock_token_') ?? false;
};
