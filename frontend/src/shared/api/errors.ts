import { isAxiosError } from 'axios'

export interface ApiErrorDetail {
  loc: (string | number)[]
  msg: string
  type: string
}

export interface ApiValidationError {
  detail: ApiErrorDetail[]
}

export function parseValidationErrors(error: unknown): Record<string, string> {
  if (!isAxiosError(error) || !error.response?.data) {
    return {}
  }

  const data = error.response.data as ApiValidationError | { detail: string }

  if (typeof data.detail === 'string') {
    return { root: data.detail }
  }

  if (Array.isArray(data.detail)) {
    const errors: Record<string, string> = {}
    for (const err of data.detail) {
      // loc usually looks like ["body", "field_name"] or ["query", "field_name"]
      // We want the last part as the field name
      const field = err.loc[err.loc.length - 1].toString()
      errors[field] = err.msg
    }
    return errors
  }

  return {}
}
