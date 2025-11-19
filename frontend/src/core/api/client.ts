export const API_BASE_URL = '/api';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  // In a real app, we'd handle auth headers here
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(response.status, `API Error: ${response.statusText}`);
  }

  return response.json();
}

// Placeholder type for session
export interface AssessmentSession {
  id: string;
  status: 'in_progress' | 'completed';
  created_at: string;
  // Add more fields as needed
}

export const api = {
  getLatestAssessmentSession: async (): Promise<AssessmentSession | null> => {
    try {
      return await fetchJson<AssessmentSession>('/assessments/latest');
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }
      throw error;
    }
  },
};
