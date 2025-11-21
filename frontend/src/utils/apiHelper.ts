/**
 * KLSI 4.0 - API Helper Utilities
 * Task 5: Base API call functions dengan automatic token injection
 * 
 * Fungsi-fungsi ini menyediakan layer abstraksi untuk HTTP calls
 * dengan error handling dan authentication yang konsisten.
 */

import { API_CONFIG } from '../config/api';
import {
  ApiError,
  handleApiError,
  isAuthError,
  emitAuthUnauthorized,
} from './errorHandler';

interface ValidationIssue {
  code?: string;
  message?: string;
}

interface ApiErrorPayload {
  detail?: string | { issues?: ValidationIssue[]; message?: string; [key: string]: unknown };
  message?: string;
  error?: string;
}

/**
 * Parse API error responses into user-friendly strings
 */
export async function parseApiError(response?: Response): Promise<string> {
  if (!response) {
    return 'Request failed';
  }

  const statusLabel = response.status
    ? `${response.status} ${response.statusText || ''}`.trim()
    : undefined;

  const contentType = response.headers?.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');

  if (isJson && typeof response.json === 'function') {
    try {
      const payload = (await response.json()) as ApiErrorPayload;
      if (typeof payload.detail === 'string') {
        return payload.detail;
      }
      if (payload.detail && typeof payload.detail === 'object') {
        const detail = payload.detail as { issues?: ValidationIssue[]; message?: string };
        const issueMessages = Array.isArray(detail.issues)
          ? detail.issues
              .map((issue) => issue?.message || issue?.code)
              .filter((value): value is string => Boolean(value))
          : [];
        if (issueMessages.length > 0) {
          return issueMessages.join('; ');
        }
        if (detail.message) {
          return detail.message;
        }
      }
      if (payload.message) return payload.message;
      if (payload.error) return payload.error;
    } catch {
      // Fall through to other strategies
    }
  }

  if (typeof response.text === 'function') {
    const text = await response.text();
    if (text) {
      return text;
    }
  }

  return statusLabel || 'Request failed';
}

/**
 * Base API call function
 * Generic HTTP call dengan error handling
 */
const applyDefaultHeaders = (headers: Headers): void => {
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', API_CONFIG.headers['Content-Type']);
  }
  if (!headers.has('X-API-Version')) {
    headers.set('X-API-Version', API_CONFIG.headers['X-API-Version']);
  }
};

export async function apiCall<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  applyDefaultHeaders(headers);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });
    const contentType = response.headers?.get('content-type') ?? '';
    const isJson = contentType.includes('application/json');

    // Handle non-OK responses
    if (!response.ok) {
      const errorMessage = await parseApiError(response);
      throw new ApiError(errorMessage || `HTTP ${response.status}: ${response.statusText}`, response.status);
    }

    // Parse response as JSON when available
    if (isJson && typeof response.json === 'function') {
      const data: unknown = await response.json();
      return data as T;
    }

    // Some endpoints may not return JSON body
    return {} as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    const friendly = handleApiError(error);
    throw new ApiError(friendly, undefined, { cause: error });
  }
}

/**
 * Authenticated API call dengan automatic token injection
 * Injects Bearer token from localStorage automatically
 */
export async function authenticatedApiCall<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  // Get token from localStorage (FIXED: use 'accessToken' key, not 'auth')
  const token = localStorage.getItem('accessToken');
  
  // Inject Authorization header (Task 5)
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  headers.set('Content-Type', 'application/json');
  
  // Merge headers back
  const authenticatedOptions: RequestInit = {
    ...options,
    headers,
  };
  
  try {
    return await apiCall<T>(url, authenticatedOptions);
  } catch (error) {
    if (error instanceof ApiError && isAuthError(error)) {
      emitAuthUnauthorized(error.message);
    }
    throw error;
  }
}

