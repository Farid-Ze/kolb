/**
 * KLSI 4.0 - Error Handler Utilities
 * Task 21: Error handling global untuk menangani 401/403
 * 
 * Centralized error handling untuk consistency
 */

import { API_CONFIG } from '../config/api';

const POST_LOGIN_REDIRECT_KEY = 'auth:postLoginRedirect';
const LAST_AUTH_ERROR_KEY = 'auth:lastAuthErrorMessage';

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Handle API errors dengan format yang konsisten
 */
export const handleApiError = (error: unknown): string => {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'Terjadi kesalahan yang tidak diketahui';
};

/**
 * Check if error is authentication error (401/403)
 */
export const isAuthError = (error: unknown): boolean => {
  if (error instanceof ApiError) {
    return error.statusCode === 401 || error.statusCode === 403;
  }
  return false;
};

const safeSessionStorage = () => {
  if (typeof window === 'undefined' || typeof window.sessionStorage === 'undefined') {
    return null;
  }
  return window.sessionStorage;
};

const safeWindowLocation = () => {
  if (typeof window === 'undefined' || typeof window.location === 'undefined') {
    return null;
  }
  return window.location;
};

export const rememberAuthIntent = () => {
  const storage = safeSessionStorage();
  const location = safeWindowLocation();
  if (!storage || !location) return;
  const redirectPath = `${location.pathname || ''}${location.search || ''}${location.hash || ''}` || '/';
  try {
    storage.setItem(POST_LOGIN_REDIRECT_KEY, redirectPath);
  } catch {}
};

export const consumeAuthIntent = (): string | null => {
  const storage = safeSessionStorage();
  if (!storage) return null;
  try {
    const value = storage.getItem(POST_LOGIN_REDIRECT_KEY);
    if (value) {
      storage.removeItem(POST_LOGIN_REDIRECT_KEY);
      return value;
    }
  } catch {}
  return null;
};

export const rememberAuthErrorMessage = (message?: string) => {
  if (!message) return;
  const storage = safeSessionStorage();
  if (!storage) return;
  try {
    storage.setItem(LAST_AUTH_ERROR_KEY, message);
  } catch {}
};

export const consumeAuthErrorMessage = (): string | null => {
  const storage = safeSessionStorage();
  if (!storage) return null;
  try {
    const value = storage.getItem(LAST_AUTH_ERROR_KEY);
    if (value) {
      storage.removeItem(LAST_AUTH_ERROR_KEY);
      return value;
    }
  } catch {}
  return null;
};

export const emitAuthUnauthorized = (message?: string) => {
  if (typeof window === 'undefined') return;
  rememberAuthIntent();
  rememberAuthErrorMessage(message ?? 'Sesi Anda telah berakhir. Silakan login kembali.');
  try {
    window.dispatchEvent(new CustomEvent('auth:unauthorized', { detail: { message } }));
  } catch {}
};

/**
 * Global fetch wrapper dengan error handling
 * Automatically handles 401/403 dan redirects to login
 */
export const apiFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = localStorage.getItem('accessToken');

  const headers = new Headers(options.headers);
  headers.set('Content-Type', API_CONFIG.headers['Content-Type']);
  headers.set('X-API-Version', API_CONFIG.headers['X-API-Version']);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Auto-logout on 401/403
  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    
    // Redirect to login jika tidak sedang di halaman login
    if (!window.location.pathname.startsWith('/auth/')) {
      window.location.href = '/auth/login';
    }
    
    throw new ApiError(
      'Sesi Anda telah berakhir. Silakan login kembali.',
      response.status
    );
  }

  return response;
};
