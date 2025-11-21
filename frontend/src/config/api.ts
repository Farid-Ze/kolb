/**
 * KLSI 4.0 - API Configuration
 * Task 3: QueryClient configuration dengan staleTime, gcTime, retry
 * 
 * Centralized API configuration untuk menghindari undefined env errors
 */

import { QueryClient } from '@tanstack/react-query';

// Fungsi helper untuk safely access environment variables
const getEnvVar = (key: string, defaultValue: string): string => {
  const envRecord = readEnvRecord();
  const rawValue = envRecord?.[key];
  return typeof rawValue === 'string' && rawValue.length > 0 ? rawValue : defaultValue;
};

const readEnvRecord = (): Record<string, string | undefined> | undefined => {
  try {
    return import.meta.env as Record<string, string | undefined>;
  } catch {
    return undefined;
  }
};

// API Base URL dengan fallback
export const API_BASE_URL = getEnvVar('VITE_API_BASE_URL', '/api');

// API Configuration
export const API_CONFIG = {
  baseURL: API_BASE_URL,
  version: '1',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
    'X-API-Version': '1',
  },
};

// Helper untuk membuat full URL
export const getApiUrl = (endpoint: string): string => {
  // Remove leading slash from endpoint if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  // Remove trailing slash from base URL if present
  const cleanBaseUrl = API_BASE_URL.endsWith('/') 
    ? API_BASE_URL.slice(0, -1) 
    : API_BASE_URL;
  
  return `${cleanBaseUrl}/${cleanEndpoint}`;
};

/**
 * Task 3: QueryClient instance dengan default options
 * 
 * Configuration mengikuti best practices:
 * - staleTime: Data dianggap segar selama 5 menit
 * - gcTime (cacheTime): Cache disimpan selama 10 menit
 * - retry: Retry otomatis 3x untuk failed requests
 * - refetchOnWindowFocus: false untuk mencegah refetch yang tidak perlu
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime in v4)
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});
