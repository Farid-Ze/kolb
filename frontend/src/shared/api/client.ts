import axios from 'axios'
import { env } from '../../config/env'

// [SECURITY NOTICE]
// Tokens are currently stored in localStorage.
// Risk: Vulnerable to XSS.
// Mitigation: 
// 1. Strict Content-Security-Policy (CSP) in index.html
// 2. Input sanitization in React components
// 3. Future Roadmap: Migrate to HttpOnly cookies for 'refresh_token'
export const TOKEN_KEY = 'zenotika.auth.token'
export const REFRESH_TOKEN_KEY = 'zenotika.auth.refreshToken'

export const apiClient = axios.create({
  baseURL: env.API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Handle 401 Unauthorized (Token Expiry)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
      if (!refreshToken) {
        // No refresh token, force logout
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(REFRESH_TOKEN_KEY)
        window.location.href = '/auth/login'
        return Promise.reject(error)
      }

      try {
        // Attempt refresh
        const { data } = await axios.post(`${env.API_URL}/api/v1/auth/refresh`, {
          refreshToken,
        })

        localStorage.setItem(TOKEN_KEY, data.access_token)
        localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token)

        originalRequest.headers.Authorization = `Bearer ${data.access_token}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        // Refresh failed, force logout
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(REFRESH_TOKEN_KEY)
        window.location.href = '/auth/login'
        return Promise.reject(refreshError)
      }
    }
    return Promise.reject(error)
  }
)
