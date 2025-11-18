/**
 * KLSI 4.0 - API Helper Utilities
 * Task 5: Base API call functions dengan automatic token injection
 * 
 * Fungsi-fungsi ini menyediakan layer abstraksi untuk HTTP calls
 * dengan error handling dan authentication yang konsisten.
 */

interface ApiErrorPayload {
  detail?: string;
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
      if (payload.detail) return payload.detail;
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
export async function apiCall<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const response = await fetch(url, options);
    const contentType = response.headers?.get('content-type') ?? '';
    const isJson = contentType.includes('application/json');

    // Handle non-OK responses
    if (!response.ok) {
      const errorMessage = await parseApiError(response);
      throw new Error(errorMessage || `HTTP ${response.status}: ${response.statusText}`);
    }

    // Parse response as JSON when available
    if (isJson && typeof response.json === 'function') {
      const data = await response.json();
      return data as T;
    }

    // Some endpoints may not return JSON body
    return {} as T;
  } catch (error) {
    // Re-throw with more context
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Network error: Unable to reach server');
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

