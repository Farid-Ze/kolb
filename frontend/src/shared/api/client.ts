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
    return Promise.reject(error)
  },
)
