export const API_BASE_URL = '/api';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }

  get isUnauthorized() {
    return this.status === 401;
  }
}

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  // In a real app, we'd handle auth headers here (e.g. from localStorage or context)
  // For now, we assume the browser handles cookies or the proxy handles it.
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    // Handle 401 specifically if needed, or just pass it through
    throw new ApiError(response.status, `API Error: ${response.statusText}`);
  }

  return response.json();
}

// --- DTOs matching Backend Models ---

export interface AssessmentResults {
  ac_score: number;
  ce_score: number;
  ae_score: number;
  ro_score: number;
  acce_score: number;
  aero_score: number;
  learning_style: string;
  lfi_score?: number;
}

export interface AssessmentSession {
  id: string;
  date: string; // ISO string
  status: string;
  results: AssessmentResults;
}

export interface AssessmentItemOption {
  id: number;
  learning_mode: string;
  text: string;
}

export interface AssessmentItem {
  id: number;
  number: number;
  type: string;
  stem: string;
  options: AssessmentItemOption[];
  category?: string;
}

export interface ItemRank {
  item_id: number;
  ranks: Record<number, number>; // choice_id -> rank (1-4)
}

export interface ContextRank {
  context_name: string;
  CE: number;
  RO: number;
  AC: number;
  AE: number;
}

export interface SessionSubmissionPayload {
  items: ItemRank[];
  contexts: ContextRank[];
}

export interface ReportData {
  session_id: number;
  raw: {
    CE: number;
    RO: number;
    AC: number;
    AE: number;
    ACCE: number;
    AERO: number;
  };
  style: {
    primary_name: string;
    primary_brief: string;
    primary_detail: string;
    intensity: string;
  };
  lfi?: {
    value: number;
    level_label: string;
  };
  visualization?: {
    kite: {
      CE: number;
      RO: number;
      AC: number;
      AE: number;
    };
  };
}

export const api = {
  startSession: async (): Promise<{ session_id: number }> => {
    return await fetchJson<{ session_id: number }>('/sessions/start', {
      method: 'POST',
    });
  },

  getSessionItems: async (sessionId: number): Promise<AssessmentItem[]> => {
    return await fetchJson<AssessmentItem[]>(`/sessions/${sessionId}/items`);
  },

  submitSession: async (sessionId: number, payload: SessionSubmissionPayload): Promise<any> => {
    return await fetchJson(`/sessions/${sessionId}/submit_all_responses`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getReport: async (sessionId: number): Promise<ReportData> => {
    return await fetchJson<ReportData>(`/reports/${sessionId}`);
  },

  getLatestAssessmentSession: async (): Promise<AssessmentSession | null> => {
    // Returns null if 404 (no session) or data if found.
    // Throws ApiError(401) if unauthorized.
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