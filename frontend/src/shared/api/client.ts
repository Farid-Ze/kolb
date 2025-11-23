import axios from 'axios'

import { env } from '../config/env'

const TOKEN_STORAGE_KEY = 'zenotika_token'

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  withCredentials: true,
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    if (status === 401 || status === 403) {
      try {
        localStorage.removeItem(TOKEN_STORAGE_KEY)
      } catch (storageError) {
        console.warn('Unable to clear auth token', storageError)
      }
      if (window.location.pathname !== '/auth') {
        window.location.assign('/auth')
      }
    }
    return Promise.reject(error)
  },
)
