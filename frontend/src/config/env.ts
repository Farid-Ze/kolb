import { z } from 'zod'

const envSchema = z.object({
    API_URL: z.string().url(),
})

const getApiUrl = () => {
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL
    }
    // [Security Fix] Enforce dynamic environment-based fallback
    // In production, we must rely on environment variables.
    if (import.meta.env.PROD) {
        return undefined
    }
    return 'http://localhost:8000'
}

export const env = envSchema.parse({
    API_URL: getApiUrl(),
})
