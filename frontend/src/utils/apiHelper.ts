/**
 * KLSI 4.0 - API Helper Utilities
 * Task 5: Base API call functions dengan automatic token injection
 * 
 * Fungsi-fungsi ini menyediakan layer abstraksi untuk HTTP calls
 * dengan error handling dan authentication yang konsisten.
 */

import { API_BASE_URL } from '../config/api';

/**
 * Base API call function
 * Generic HTTP call dengan error handling
 */
export async function apiCall<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const response = await fetch(url, options);
    
    // Handle non-OK responses
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.detail || errorJson.message || errorMessage;
      } catch {
        // If not JSON, use status text
        errorMessage = errorText || errorMessage;
      }
      
      throw new Error(errorMessage);
    }
    
    // Parse response as JSON
    const data = await response.json();
    return data as T;
  } catch (error) {
    // Re-throw with more context
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown error occurred');
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
  
  return apiCall<T>(url, authenticatedOptions);
}

/**
 * Helper to build full API URL
 * @deprecated Use getApiUrl from config/api.ts instead
 */
export function buildApiUrl(path: string): string {
  const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const endpoint = path.startsWith('/') ? path : `/${path}`;
  return `${base}${endpoint}`;
}
