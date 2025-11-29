import axios from 'axios';
import { OpenAPI } from './generated/core/OpenAPI';

// Configure OpenAPI base URL
// Default to localhost:8000 if not specified in environment variables
OpenAPI.BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/v1';

// Configure global axios defaults
// This ensures that the generated services (which use the default axios instance)
// pick up these configurations.
axios.defaults.baseURL = OpenAPI.BASE;

// Request interceptor for Auth Token
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Handle Guest Token for anonymous assessments
  const guestToken = localStorage.getItem('guestToken');
  if (guestToken) {
    config.headers['X-Guest-Token'] = guestToken;
  }

  return config;
});

// Response interceptor for 401 and Errors
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 - Refresh Token Logic
    // We avoid infinite loops by checking the _retry flag
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // TODO: Implement robust refresh token flow
      // For now, we'll just clear the token and redirect to login
      // to prevent the app from getting stuck in a broken state.
      localStorage.removeItem('accessToken');

      // Only redirect if we are not already on the login page
      if (!window.location.pathname.includes('/login')) {
        // window.location.href = '/login'; 
        // Commented out to prevent hard redirects during dev/testing without router
      }
    }

    return Promise.reject(error);
  }
);

export { axios };
export const apiClient = axios;
