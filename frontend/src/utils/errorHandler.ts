/**
 * KLSI 4.0 - Error Handler Utilities
 * Task 21: Error handling global untuk menangani 401/403
 * 
 * Centralized error handling untuk consistency
 */

import { API_CONFIG } from '../config/api';

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
